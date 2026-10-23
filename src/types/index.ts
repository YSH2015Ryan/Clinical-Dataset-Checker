export type Severity = 'blocker' | 'warning' | 'info';

export interface Issue {
  ruleId: string;
  severity: Severity;
  titleKey: string;
  descriptionKey: string;
  columnNames: string[];
  rowIndexesSample: number[];
  affectedCount: number;
  denominator?: number;
  details: Record<string, string | number | boolean | null>;
  actionKey: string;
}

export type CellValue = string | number | boolean | null;

export interface DatasetProfile {
  fileName: string;
  fileSize: number;
  format: 'csv' | 'xlsx';
  sheetName?: string;
  headers: string[];
  rows: CellValue[][];
  totalRows: number;
  totalColumns: number;
  headerRowIndex: number;
  idColumnIndex?: number;
  allowedMissingMarkers: string[];
  isLongitudinal: boolean;
  analysisUnit?: string;
  dateColumnIndexes?: number[];
  startDateColumnIndex?: number;
  endDateColumnIndex?: number;
  parseTimestamp: number;
}

export interface ParseResult {
  success: boolean;
  data?: DatasetProfile;
  error?: string;
  errorCode?: string;
  warnings: string[];
  sheetNames?: string[];
  detectedSeparator?: string;
}

export interface ImportConfig {
  separator?: string;
  headerRowIndex: number;
  sheetName?: string;
  idColumnIndex?: number;
  missingMarkers: string[];
  isLongitudinal: boolean;
  analysisUnit?: string;
  dateColumnIndexes?: number[];
  startDateColumnIndex?: number;
  endDateColumnIndex?: number;
}

export interface CheckResult {
  datasetProfile: DatasetProfile;
  issues: Issue[];
  ruleVersion: string;
  appVersion: string;
  runTimestamp: number;
  config: ImportConfig;
}

export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  headerRowIndex: 0,
  missingMarkers: ['NA', 'N/A', 'NULL', 'unknown', '-'],
  isLongitudinal: false,
  dateColumnIndexes: [],
};
