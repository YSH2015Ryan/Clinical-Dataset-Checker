import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CellValue, DatasetProfile, ImportConfig, ParseResult } from '@/types/index';

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_ROWS = 100000;
export const MAX_COLUMNS = 500;

function buildProfile(
  partial: Omit<DatasetProfile, 'totalRows' | 'totalColumns' | 'rows' | 'headers'>,
  headers: string[],
  rows: CellValue[][]
): DatasetProfile {
  return {
    ...partial,
    headers,
    rows,
    totalRows: rows.length,
    totalColumns: headers.length,
  };
}

function checkLimits(rowCount: number, colCount: number): ParseResult | null {
  if (rowCount === 0 || colCount === 0) {
    return { success: false, error: 'File is empty', errorCode: 'FILE_EMPTY', warnings: [] };
  }
  if (rowCount > MAX_ROWS || colCount > MAX_COLUMNS) {
    return {
      success: false,
      error: 'Data exceeds limits',
      errorCode: 'ROW_COLUMN_LIMIT',
      warnings: [],
    };
  }
  return null;
}

/**
 * Parse CSV text content. Exposed separately from File handling so unit tests
 * can run in Node without a DOM File implementation.
 */
export function parseCSVText(
  text: string,
  fileName: string,
  fileSize: number,
  config: ImportConfig
): ParseResult {
  const headerRowIndex = config.headerRowIndex ?? 0;
  const delimiter = config.separator ?? '';

  // Strip trailing blank lines: Papa keeps a phantom empty row for a final
  // newline, which would otherwise be misreported as an empty data row.
  const normalizedText = text.replace(/(\r?\n)+$/, '');

  const results = Papa.parse<string[]>(normalizedText, {
    delimiter,
    skipEmptyLines: false,
  });

  const data = results.data;
  if (data.length === 0) {
    return { success: false, error: 'File is empty', errorCode: 'FILE_EMPTY', warnings: [] };
  }

  if (results.errors.length > 0 && results.data.length === 0) {
    return {
      success: false,
      error: results.errors[0].message,
      errorCode: 'PARSE_ERROR',
      warnings: [],
    };
  }

  const limitError = checkLimits(data.length, data[0]?.length ?? 0);
  if (limitError) return limitError;

  if (headerRowIndex >= data.length) {
    return {
      success: false,
      error: 'Invalid header row index',
      errorCode: 'INVALID_HEADER_ROW',
      warnings: [],
    };
  }

  const headers = data[headerRowIndex].map((h) => String(h ?? ''));
  const rows = data.slice(headerRowIndex + 1) as CellValue[][];

  if (rows.length === 0 || headers.length === 0) {
    return { success: false, error: 'File is empty', errorCode: 'FILE_EMPTY', warnings: [] };
  }

  const warnings: string[] = [];
  if (results.errors.length > 0) {
    warnings.push(`parse_warnings:${results.errors.length}`);
  }

  return {
    success: true,
    data: buildProfile(
      {
        fileName,
        fileSize,
        format: 'csv',
        headerRowIndex,
        idColumnIndex: config.idColumnIndex,
        allowedMissingMarkers: config.missingMarkers ?? [],
        isLongitudinal: config.isLongitudinal ?? false,
        analysisUnit: config.analysisUnit,
        dateColumnIndexes: config.dateColumnIndexes,
        startDateColumnIndex: config.startDateColumnIndex,
        endDateColumnIndex: config.endDateColumnIndex,
        parseTimestamp: Date.now(),
      },
      headers,
      rows
    ),
    warnings,
    detectedSeparator: results.meta.delimiter,
  };
}

export async function parseCSV(file: File, config: ImportConfig): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File too large',
      errorCode: 'FILE_TOO_LARGE',
      warnings: [],
    };
  }
  const text = await file.text();
  return parseCSVText(text, file.name, file.size, config);
}

/**
 * Parse an XLSX workbook from an ArrayBuffer. Exposed separately for testability.
 */
export function parseXLSXBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number,
  config: ImportConfig
): ParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { cellFormula: true, cellDates: false });
  } catch (err) {
    return {
      success: false,
      error: String(err),
      errorCode: 'PARSE_ERROR',
      warnings: [],
    };
  }

  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    return { success: false, error: 'No sheets found', errorCode: 'FILE_EMPTY', warnings: [] };
  }

  const sheetName =
    config.sheetName && sheetNames.includes(config.sheetName) ? config.sheetName : sheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const warnings: string[] = [];
  let formulaCount = 0;
  for (const addr of Object.keys(worksheet)) {
    if (addr.startsWith('!')) continue;
    const cell = worksheet[addr] as XLSX.CellObject & { f?: string };
    if (cell && cell.f) formulaCount++;
  }
  if (formulaCount > 0) {
    warnings.push(`formula_cached_values:${formulaCount}`);
  }

  const data = XLSX.utils.sheet_to_json<CellValue[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const limitError = checkLimits(data.length, (data[0] as CellValue[] | undefined)?.length ?? 0);
  if (limitError) return { ...limitError, sheetNames };

  const headerRowIndex = config.headerRowIndex ?? 0;
  if (headerRowIndex >= data.length) {
    return {
      success: false,
      error: 'Invalid header row index',
      errorCode: 'INVALID_HEADER_ROW',
      warnings: [],
      sheetNames,
    };
  }

  const headers = ((data[headerRowIndex] as CellValue[]) ?? []).map((h) => String(h ?? ''));
  const rows = data.slice(headerRowIndex + 1) as CellValue[][];

  if (rows.length === 0 || headers.length === 0) {
    return { success: false, error: 'File is empty', errorCode: 'FILE_EMPTY', warnings: [] };
  }

  return {
    success: true,
    data: buildProfile(
      {
        fileName,
        fileSize,
        format: 'xlsx',
        sheetName,
        headerRowIndex,
        idColumnIndex: config.idColumnIndex,
        allowedMissingMarkers: config.missingMarkers ?? [],
        isLongitudinal: config.isLongitudinal ?? false,
        analysisUnit: config.analysisUnit,
        dateColumnIndexes: config.dateColumnIndexes,
        startDateColumnIndex: config.startDateColumnIndex,
        endDateColumnIndex: config.endDateColumnIndex,
        parseTimestamp: Date.now(),
      },
      headers,
      rows
    ),
    warnings,
    sheetNames,
  };
}

export async function parseXLSX(file: File, config: ImportConfig): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File too large',
      errorCode: 'FILE_TOO_LARGE',
      warnings: [],
    };
  }
  const buffer = await file.arrayBuffer();
  return parseXLSXBuffer(buffer, file.name, file.size, config);
}

export async function parseFile(file: File, config: ImportConfig): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCSV(file, config);
  }
  if (ext === 'xlsx') {
    return parseXLSX(file, config);
  }
  return {
    success: false,
    error: 'Unsupported file format',
    errorCode: 'FILE_UNSUPPORTED',
    warnings: [],
  };
}
