import { Issue, DatasetProfile, Severity, CellValue } from '@/types/index';

const RULE_VERSION = '1.0.0';
const MAX_SAMPLE_ROWS = 10;

export function createIssue(
  ruleId: string,
  severity: Severity,
  titleKey: string,
  descriptionKey: string,
  columnNames: string[],
  rowIndexesSample: number[],
  affectedCount: number,
  details: Record<string, string | number | boolean | null>,
  actionKey: string,
  denominator?: number
): Issue {
  return {
    ruleId,
    severity,
    titleKey,
    descriptionKey,
    columnNames,
    rowIndexesSample,
    affectedCount,
    denominator,
    details,
    actionKey,
  };
}

function isBlankCell(cell: CellValue): boolean {
  return cell === null || cell === '' || (typeof cell === 'string' && cell.trim() === '');
}

function isMissingCell(cell: CellValue, markersLower: Set<string>): boolean {
  if (isBlankCell(cell)) return true;
  if (typeof cell === 'string') {
    return markersLower.has(cell.trim().toLowerCase());
  }
  return false;
}

/** Strict numeric detection: plain decimals, negatives, scientific notation. No thousand separators. */
const STRICT_NUMERIC_RE = /^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/;

function asStrictNumber(cell: CellValue): number | null {
  if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
  if (typeof cell === 'string' && STRICT_NUMERIC_RE.test(cell.trim())) {
    const n = Number(cell.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * R Type 7 quantile (default in R, NumPy, pandas).
 * h = (n - 1) * p; linear interpolation between floor(h) and ceil(h).
 * This definition is FIXED for the OUTLIER_IQR_FLAG rule and verified by oracle tests.
 */
export function quantileType7(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const h = (n - 1) * p;
  const j = Math.floor(h);
  const g = h - j;
  if (j + 1 >= n) return sorted[j];
  return sorted[j] + g * (sorted[j + 1] - sorted[j]);
}

/** Unambiguous ISO-style date: YYYY-MM-DD or YYYY/MM/DD. Returns null when not matching or invalid. */
export function parseISODate(cell: CellValue): Date | null {
  if (typeof cell !== 'string') return null;
  const m = /^(\d{4})[-/](\d{2})[-/](\d{2})([T ].*)?$/.exec(cell.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

/** Date-like strings where day/month order cannot be determined reliably, e.g. 01/02/2026. */
const AMBIGUOUS_DATE_RE = /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/;

/** Excel date serial numbers plausibly representing modern dates (1970-01-01 .. 2100-01-01). */
function isPlausibleExcelSerial(cell: CellValue): boolean {
  return typeof cell === 'number' && cell >= 25569 && cell <= 73050;
}

// HEADER_EMPTY
export function checkHeaderEmpty(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const emptyIndices: number[] = [];

  profile.headers.forEach((header, idx) => {
    if (!header || header.trim() === '') {
      emptyIndices.push(idx);
    }
  });

  if (emptyIndices.length > 0) {
    issues.push(
      createIssue(
        'HEADER_EMPTY',
        'warning',
        'check.header_empty.title',
        'check.header_empty.description',
        emptyIndices.map((idx) => `Column_${idx + 1}`),
        [],
        emptyIndices.length,
        {
          columnIndices: emptyIndices.map((i) => i + 1).join(','),
          totalColumns: profile.totalColumns,
        },
        'check.header_empty.action'
      )
    );
  }

  return issues;
}

// HEADER_DUPLICATE
export function checkHeaderDuplicate(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const seen = new Map<string, number[]>();

  profile.headers.forEach((header, idx) => {
    const normalized = header.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.set(normalized, []);
    }
    seen.get(normalized)!.push(idx);
  });

  const duplicates: { name: string; indices: number[] }[] = [];
  seen.forEach((indices) => {
    if (indices.length > 1) {
      duplicates.push({ name: profile.headers[indices[0]], indices });
    }
  });

  if (duplicates.length > 0) {
    const affectedColumns = duplicates.flatMap((d) => d.indices.map((i) => profile.headers[i]));
    issues.push(
      createIssue(
        'HEADER_DUPLICATE',
        'blocker',
        'check.header_duplicate.title',
        'check.header_duplicate.description',
        affectedColumns,
        [],
        affectedColumns.length,
        {
          duplicateCount: duplicates.length,
          duplicateList: duplicates.map((d) => d.name).join('; '),
        },
        'check.header_duplicate.action'
      )
    );
  }

  return issues;
}

// ROW_EMPTY
export function checkRowEmpty(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const emptyRowIndices: number[] = [];

  profile.rows.forEach((row, rowIdx) => {
    if (row.every((cell) => isBlankCell(cell))) {
      emptyRowIndices.push(rowIdx + 1); // 1-based data row index
    }
  });

  if (emptyRowIndices.length > 0) {
    issues.push(
      createIssue(
        'ROW_EMPTY',
        'warning',
        'check.row_empty.title',
        'check.row_empty.description',
        [],
        emptyRowIndices.slice(0, MAX_SAMPLE_ROWS),
        emptyRowIndices.length,
        {
          totalRows: profile.totalRows,
          emptyCount: emptyRowIndices.length,
          emptyRate: ((emptyRowIndices.length / profile.totalRows) * 100).toFixed(2),
        },
        'check.row_empty.action',
        profile.totalRows
      )
    );
  }

  return issues;
}

// COLUMN_EMPTY
export function checkColumnEmpty(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const emptyColumns: { index: number; name: string }[] = [];

  profile.headers.forEach((header, colIdx) => {
    const isEmpty =
      profile.rows.length === 0 || profile.rows.every((row) => isBlankCell(row[colIdx]));
    if (isEmpty && profile.rows.length > 0) {
      emptyColumns.push({ index: colIdx, name: header });
    }
  });

  if (emptyColumns.length > 0) {
    issues.push(
      createIssue(
        'COLUMN_EMPTY',
        'warning',
        'check.column_empty.title',
        'check.column_empty.description',
        emptyColumns.map((c) => c.name),
        [],
        emptyColumns.length,
        {
          emptyColumnCount: emptyColumns.length,
          totalColumns: profile.totalColumns,
        },
        'check.column_empty.action'
      )
    );
  }

  return issues;
}

// MISSING_VALUES
export function checkMissingValues(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  // Case-insensitive comparison on BOTH sides; markers are trimmed before matching.
  const markersLower = new Set(
    profile.allowedMissingMarkers.map((m) => m.trim().toLowerCase()).filter((m) => m.length > 0)
  );

  const missingByColumn: { colIdx: number; colName: string; count: number }[] = [];

  profile.headers.forEach((header, colIdx) => {
    let missingCount = 0;
    profile.rows.forEach((row) => {
      if (isMissingCell(row[colIdx], markersLower)) {
        missingCount++;
      }
    });
    if (missingCount > 0) {
      missingByColumn.push({ colIdx, colName: header, count: missingCount });
    }
  });

  if (missingByColumn.length > 0) {
    const totalMissing = missingByColumn.reduce((sum, m) => sum + m.count, 0);
    const details: Record<string, string | number | boolean | null> = {
      columnsWithMissing: missingByColumn.length,
      totalMissing,
      totalCells: profile.totalRows * profile.totalColumns,
      markersUsed: profile.allowedMissingMarkers.join('|'),
    };
    missingByColumn.forEach((m) => {
      details[`${m.colName}_missing`] = m.count;
      details[`${m.colName}_rate%`] = ((m.count / profile.totalRows) * 100).toFixed(2);
    });

    issues.push(
      createIssue(
        'MISSING_VALUES',
        'info',
        'check.missing_values.title',
        'check.missing_values.description',
        missingByColumn.map((m) => m.colName),
        [],
        totalMissing,
        details,
        'check.missing_values.action',
        profile.totalRows * profile.totalColumns
      )
    );
  }

  return issues;
}

// EXACT_DUPLICATE_ROWS
export function checkExactDuplicateRows(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const rowStrings = new Map<string, number[]>();

  profile.rows.forEach((row, rowIdx) => {
    const normalized = row
      .map((cell) => {
        if (typeof cell === 'string') return cell.trim();
        return String(cell === null ? '' : cell);
      })
      .join('||');
    if (!rowStrings.has(normalized)) {
      rowStrings.set(normalized, []);
    }
    rowStrings.get(normalized)!.push(rowIdx + 1);
  });

  const duplicateRowIndexes: number[] = [];
  let duplicateSetCount = 0;
  rowStrings.forEach((indices) => {
    if (indices.length > 1) {
      duplicateSetCount++;
      // All rows after the first occurrence count as duplicated rows.
      duplicateRowIndexes.push(...indices.slice(1));
    }
  });

  if (duplicateRowIndexes.length > 0) {
    issues.push(
      createIssue(
        'EXACT_DUPLICATE_ROWS',
        'warning',
        'check.exact_duplicate_rows.title',
        'check.exact_duplicate_rows.description',
        [],
        duplicateRowIndexes.slice(0, MAX_SAMPLE_ROWS),
        duplicateRowIndexes.length,
        {
          duplicateRowCount: duplicateRowIndexes.length,
          duplicateSetCount,
          totalRows: profile.totalRows,
        },
        'check.exact_duplicate_rows.action',
        profile.totalRows
      )
    );
  }

  return issues;
}

// DUPLICATE_ID
// Per plan §5.5: user declares "one row per participant" -> blocker;
// user declares longitudinal/repeated measures allowed -> warning.
export function checkDuplicateId(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];

  if (profile.idColumnIndex === undefined || profile.idColumnIndex < 0) {
    return issues;
  }
  if (profile.idColumnIndex >= profile.totalColumns) {
    return issues;
  }

  const idMap = new Map<string, number[]>();

  profile.rows.forEach((row, rowIdx) => {
    const idCell = row[profile.idColumnIndex!];
    const idStr = String(idCell ?? '').trim();
    if (idStr) {
      if (!idMap.has(idStr)) {
        idMap.set(idStr, []);
      }
      idMap.get(idStr)!.push(rowIdx + 1);
    }
  });

  const duplicateIdValues: string[] = [];
  const affectedRows: number[] = [];
  idMap.forEach((indices, id) => {
    if (indices.length > 1) {
      duplicateIdValues.push(id);
      affectedRows.push(...indices);
    }
  });

  if (duplicateIdValues.length > 0) {
    const severity: Severity = profile.isLongitudinal ? 'warning' : 'blocker';

    issues.push(
      createIssue(
        'DUPLICATE_ID',
        severity,
        'check.duplicate_id.title',
        'check.duplicate_id.description',
        [profile.headers[profile.idColumnIndex]],
        affectedRows.slice(0, MAX_SAMPLE_ROWS),
        duplicateIdValues.length,
        {
          duplicateIdCount: duplicateIdValues.length,
          totalAffectedRows: affectedRows.length,
          isLongitudinal: profile.isLongitudinal,
        },
        'check.duplicate_id.action',
        profile.totalRows
      )
    );
  }

  return issues;
}

// MIXED_TYPES
type ObservedType = 'boolean' | 'number' | 'date-string' | 'numeric-string' | 'text';

function classifyCell(cell: CellValue): ObservedType | null {
  if (isBlankCell(cell)) return null;
  if (typeof cell === 'boolean') return 'boolean';
  if (typeof cell === 'number') return 'number';
  const s = (cell as string).trim();
  if (parseISODate(s) !== null || AMBIGUOUS_DATE_RE.test(s)) return 'date-string';
  if (STRICT_NUMERIC_RE.test(s)) return 'number';
  if (/^[\d.,\s+-]+$/.test(s) && /\d/.test(s)) return 'numeric-string';
  return 'text';
}

export function checkMixedTypes(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const mixedColumns: { colIdx: number; colName: string; types: Map<string, number> }[] = [];

  profile.headers.forEach((header, colIdx) => {
    const typeMap = new Map<string, number>();

    profile.rows.forEach((row) => {
      const t = classifyCell(row[colIdx]);
      if (t === null) return;
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
    });

    // A column is "mixed" when at least two type categories each cover >= 10% of non-empty cells.
    const nonEmpty = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);
    if (nonEmpty === 0) return;
    const significant = Array.from(typeMap.values()).filter((c) => c / nonEmpty >= 0.1);
    if (typeMap.size > 1 && significant.length > 1) {
      mixedColumns.push({ colIdx, colName: header, types: typeMap });
    }
  });

  if (mixedColumns.length > 0) {
    const sample: number[] = [];
    mixedColumns.slice(0, 5).forEach((col) => {
      for (let i = 0; i < profile.rows.length && sample.length < MAX_SAMPLE_ROWS; i++) {
        if (!isBlankCell(profile.rows[i][col.colIdx])) {
          sample.push(i + 1);
        }
      }
    });

    const details: Record<string, string | number | boolean | null> = {
      columnsWithMixedTypes: mixedColumns.length,
    };
    mixedColumns.forEach((col) => {
      details[col.colName] = Array.from(col.types.entries())
        .map(([t, c]) => `${t}:${c}`)
        .join('; ');
    });

    issues.push(
      createIssue(
        'MIXED_TYPES',
        'warning',
        'check.mixed_types.title',
        'check.mixed_types.description',
        mixedColumns.map((m) => m.colName),
        sample,
        mixedColumns.length,
        details,
        'check.mixed_types.action'
      )
    );
  }

  return issues;
}

// NUMERIC_PARSE_AMBIGUITY
// Flags values like "1,234" / "1.234" / "1 234" / "1,23" where the decimal/thousands
// convention cannot be determined. Never converts values.
export function checkNumericParseAmbiguity(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const ambiguousColumns: { colIdx: number; colName: string; count: number; examples: string[] }[] =
    [];

  const ambiguousValueRe = /^[+-]?\d{1,3}([.,\s]\d{3})+([.,]\d+)?$|^[+-]?\d+[.,]\d{1,2}$/;

  profile.headers.forEach((header, colIdx) => {
    let count = 0;
    const examples = new Set<string>();

    profile.rows.forEach((row) => {
      const cell = row[colIdx];
      if (typeof cell !== 'string') return;
      const s = cell.trim();
      if (STRICT_NUMERIC_RE.test(s)) return; // unambiguous
      if (ambiguousValueRe.test(s)) {
        count++;
        if (examples.size < 3) examples.add(s);
      }
    });

    if (count > 0) {
      ambiguousColumns.push({ colIdx, colName: header, count, examples: Array.from(examples) });
    }
  });

  if (ambiguousColumns.length > 0) {
    const sample: number[] = [];
    ambiguousColumns.slice(0, 5).forEach((col) => {
      for (let i = 0; i < profile.rows.length && sample.length < MAX_SAMPLE_ROWS; i++) {
        const cell = profile.rows[i][col.colIdx];
        if (typeof cell === 'string' && ambiguousValueRe.test(cell.trim())) {
          sample.push(i + 1);
        }
      }
    });

    const details: Record<string, string | number | boolean | null> = {
      ambiguousColumnCount: ambiguousColumns.length,
    };
    ambiguousColumns.forEach((col) => {
      details[col.colName] = `${col.count} ambiguous, e.g. ${col.examples.join(', ')}`;
    });

    issues.push(
      createIssue(
        'NUMERIC_PARSE_AMBIGUITY',
        'warning',
        'check.numeric_parse_ambiguity.title',
        'check.numeric_parse_ambiguity.description',
        ambiguousColumns.map((m) => m.colName),
        sample,
        ambiguousColumns.reduce((sum, c) => sum + c.count, 0),
        details,
        'check.numeric_parse_ambiguity.action',
        profile.totalRows
      )
    );
  }

  return issues;
}

// INVALID_DATE_CANDIDATE
// Runs only on columns the user explicitly designated as date columns.
// ISO values parse cleanly; ambiguous day/month formats and Excel serials are flagged
// as "cannot determine / needs user confirmation" — never guessed.
export function checkInvalidDateCandidate(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const dateCols = profile.dateColumnIndexes ?? [];
  if (dateCols.length === 0) return issues;

  const markersLower = new Set(
    profile.allowedMissingMarkers.map((m) => m.trim().toLowerCase()).filter((m) => m.length > 0)
  );

  const flagged: {
    colIdx: number;
    colName: string;
    unparseable: number;
    ambiguous: number;
    serial: number;
    sampleRows: number[];
  }[] = [];

  dateCols.forEach((colIdx) => {
    if (colIdx < 0 || colIdx >= profile.totalColumns) return;
    let unparseable = 0;
    let ambiguous = 0;
    let serial = 0;
    const sampleRows: number[] = [];

    profile.rows.forEach((row, rowIdx) => {
      const cell = row[colIdx];
      if (isMissingCell(cell, markersLower)) return;

      if (parseISODate(cell) !== null) return; // clean ISO date

      if (typeof cell === 'string' && AMBIGUOUS_DATE_RE.test(cell.trim())) {
        ambiguous++;
        if (sampleRows.length < MAX_SAMPLE_ROWS) sampleRows.push(rowIdx + 1);
        return;
      }
      if (isPlausibleExcelSerial(cell)) {
        serial++;
        if (sampleRows.length < MAX_SAMPLE_ROWS) sampleRows.push(rowIdx + 1);
        return;
      }
      unparseable++;
      if (sampleRows.length < MAX_SAMPLE_ROWS) sampleRows.push(rowIdx + 1);
    });

    if (unparseable + ambiguous + serial > 0) {
      flagged.push({
        colIdx,
        colName: profile.headers[colIdx],
        unparseable,
        ambiguous,
        serial,
        sampleRows,
      });
    }
  });

  if (flagged.length > 0) {
    const totalAffected = flagged.reduce((s, f) => s + f.unparseable + f.ambiguous + f.serial, 0);
    const sample = flagged.flatMap((f) => f.sampleRows).slice(0, MAX_SAMPLE_ROWS);
    const details: Record<string, string | number | boolean | null> = {};
    flagged.forEach((f) => {
      details[f.colName] =
        `unparseable:${f.unparseable}; ambiguous_order:${f.ambiguous}; excel_serial:${f.serial}`;
    });

    issues.push(
      createIssue(
        'INVALID_DATE_CANDIDATE',
        'warning',
        'check.invalid_date_candidate.title',
        'check.invalid_date_candidate.description',
        flagged.map((f) => f.colName),
        sample,
        totalAffected,
        details,
        'check.invalid_date_candidate.action'
      )
    );
  }

  return issues;
}

// DATE_ORDER
// Runs only when the user explicitly designated start and end date columns.
export function checkDateOrder(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const startIdx = profile.startDateColumnIndex;
  const endIdx = profile.endDateColumnIndex;
  if (startIdx === undefined || endIdx === undefined) return issues;
  if (
    startIdx < 0 ||
    endIdx < 0 ||
    startIdx >= profile.totalColumns ||
    endIdx >= profile.totalColumns
  ) {
    return issues;
  }

  const badRows: number[] = [];

  profile.rows.forEach((row, rowIdx) => {
    const start = parseISODate(row[startIdx]);
    const end = parseISODate(row[endIdx]);
    if (start !== null && end !== null && end.getTime() < start.getTime()) {
      badRows.push(rowIdx + 1);
    }
  });

  if (badRows.length > 0) {
    issues.push(
      createIssue(
        'DATE_ORDER',
        'warning',
        'check.date_order.title',
        'check.date_order.description',
        [profile.headers[startIdx], profile.headers[endIdx]],
        badRows.slice(0, MAX_SAMPLE_ROWS),
        badRows.length,
        {
          startColumn: profile.headers[startIdx],
          endColumn: profile.headers[endIdx],
          violationCount: badRows.length,
        },
        'check.date_order.action',
        profile.totalRows
      )
    );
  }

  return issues;
}

// CONSTANT_COLUMN
export function checkConstantColumn(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const constantColumns: { colIdx: number; colName: string; value: string }[] = [];

  profile.headers.forEach((header, colIdx) => {
    const nonEmptyValues = new Set<string>();
    profile.rows.forEach((row) => {
      const cell = row[colIdx];
      if (!isBlankCell(cell)) {
        nonEmptyValues.add(String(cell));
      }
    });

    if (nonEmptyValues.size === 1 && profile.rows.length > 0) {
      constantColumns.push({ colIdx, colName: header, value: Array.from(nonEmptyValues)[0] });
    }
  });

  if (constantColumns.length > 0) {
    const details: Record<string, string | number | boolean | null> = {
      constantColumnCount: constantColumns.length,
    };
    constantColumns.forEach((col) => {
      // Do not embed the raw constant value in reports (it is user data);
      // describe it structurally instead.
      details[col.colName] =
        `single value (type: ${typeof col.value}, length: ${col.value.length})`;
    });

    issues.push(
      createIssue(
        'CONSTANT_COLUMN',
        'info',
        'check.constant_column.title',
        'check.constant_column.description',
        constantColumns.map((c) => c.colName),
        [],
        constantColumns.length,
        details,
        'check.constant_column.action'
      )
    );
  }

  return issues;
}

// HIGH_CARDINALITY_CATEGORY
// Text columns only: skips the user-designated ID column and columns whose values
// are predominantly numeric.
export function checkHighCardinalityCategory(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const highCardinalityColumns: {
    colIdx: number;
    colName: string;
    uniqueCount: number;
    ratio: number;
  }[] = [];

  profile.headers.forEach((header, colIdx) => {
    if (colIdx === profile.idColumnIndex) return;

    let nonEmpty = 0;
    let numeric = 0;
    const uniqueValues = new Set<string>();

    profile.rows.forEach((row) => {
      const cell = row[colIdx];
      if (isBlankCell(cell)) return;
      nonEmpty++;
      if (asStrictNumber(cell) !== null) numeric++;
      uniqueValues.add(String(cell));
    });

    if (nonEmpty === 0) return;
    const isTextColumn = numeric / nonEmpty < 0.5;
    if (!isTextColumn) return;

    const ratio = uniqueValues.size / nonEmpty;
    if (ratio > 0.5 && uniqueValues.size > 20) {
      highCardinalityColumns.push({
        colIdx,
        colName: header,
        uniqueCount: uniqueValues.size,
        ratio,
      });
    }
  });

  if (highCardinalityColumns.length > 0) {
    const details: Record<string, string | number | boolean | null> = {
      highCardinalityCount: highCardinalityColumns.length,
    };
    highCardinalityColumns.forEach((col) => {
      details[col.colName] = `${col.uniqueCount} unique (${(col.ratio * 100).toFixed(1)}%)`;
    });

    issues.push(
      createIssue(
        'HIGH_CARDINALITY_CATEGORY',
        'info',
        'check.high_cardinality_category.title',
        'check.high_cardinality_category.description',
        highCardinalityColumns.map((c) => c.colName),
        [],
        highCardinalityColumns.length,
        details,
        'check.high_cardinality_category.action'
      )
    );
  }

  return issues;
}

// OUTLIER_IQR_FLAG
// Quartiles use the R Type 7 definition (see quantileType7). Exploratory flag only.
export function checkOutlierIqrFlag(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const numericColumns: { colIdx: number; colName: string; outlierRows: number[] }[] = [];

  profile.headers.forEach((header, colIdx) => {
    const values: number[] = [];

    profile.rows.forEach((row) => {
      const n = asStrictNumber(row[colIdx]);
      if (n !== null) values.push(n);
    });

    if (values.length < 4) return;
    // Only run when the column is predominantly numeric (>= 80% of non-empty cells).
    const nonEmpty = profile.rows.filter((row) => !isBlankCell(row[colIdx])).length;
    if (nonEmpty === 0 || values.length / nonEmpty < 0.8) return;

    values.sort((a, b) => a - b);
    const q1 = quantileType7(values, 0.25);
    const q3 = quantileType7(values, 0.75);
    const iqr = q3 - q1;
    if (iqr === 0) return;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outlierRows: number[] = [];
    profile.rows.forEach((row, rowIdx) => {
      const n = asStrictNumber(row[colIdx]);
      if (n !== null && (n < lowerBound || n > upperBound)) {
        outlierRows.push(rowIdx + 1);
      }
    });

    if (outlierRows.length > 0) {
      numericColumns.push({ colIdx, colName: header, outlierRows });
    }
  });

  if (numericColumns.length > 0) {
    const totalOutliers = numericColumns.reduce((sum, c) => sum + c.outlierRows.length, 0);
    const sample = numericColumns.flatMap((c) => c.outlierRows).slice(0, MAX_SAMPLE_ROWS);

    const details: Record<string, string | number | boolean | null> = {
      columnsWithOutliers: numericColumns.length,
      totalOutlierFlags: totalOutliers,
      quantileDefinition: 'R Type 7',
    };
    numericColumns.forEach((col) => {
      details[col.colName] = `${col.outlierRows.length} flagged`;
    });

    issues.push(
      createIssue(
        'OUTLIER_IQR_FLAG',
        'info',
        'check.outlier_iqr_flag.title',
        'check.outlier_iqr_flag.description',
        numericColumns.map((c) => c.colName),
        sample,
        totalOutliers,
        details,
        'check.outlier_iqr_flag.action'
      )
    );
  }

  return issues;
}

// POSSIBLE_OUTCOME_LEAKAGE
// Heuristic only — always warning, never asserts leakage actually exists.
export function checkPossibleOutcomeLeakage(profile: DatasetProfile): Issue[] {
  const issues: Issue[] = [];
  const leakageKeywords = ['outcome', 'result', 'diagnosis', 'prognosis', 'endpoint'];
  const leakageColumns: { colIdx: number; colName: string }[] = [];

  profile.headers.forEach((header, colIdx) => {
    if (colIdx === profile.idColumnIndex) return;
    const lowerHeader = header.toLowerCase();
    if (leakageKeywords.some((kw) => lowerHeader.includes(kw))) {
      leakageColumns.push({ colIdx, colName: header });
    }
  });

  if (leakageColumns.length > 0) {
    issues.push(
      createIssue(
        'POSSIBLE_OUTCOME_LEAKAGE',
        'warning',
        'check.possible_outcome_leakage.title',
        'check.possible_outcome_leakage.description',
        leakageColumns.map((c) => c.colName),
        [],
        leakageColumns.length,
        {
          suspiciousColumns: leakageColumns.map((c) => c.colName).join('; '),
        },
        'check.possible_outcome_leakage.action'
      )
    );
  }

  return issues;
}

export function runAllChecks(profile: DatasetProfile): Issue[] {
  const allIssues: Issue[] = [];

  allIssues.push(...checkHeaderEmpty(profile));
  allIssues.push(...checkHeaderDuplicate(profile));
  allIssues.push(...checkRowEmpty(profile));
  allIssues.push(...checkColumnEmpty(profile));
  allIssues.push(...checkMissingValues(profile));
  allIssues.push(...checkExactDuplicateRows(profile));
  allIssues.push(...checkDuplicateId(profile));
  allIssues.push(...checkMixedTypes(profile));
  allIssues.push(...checkNumericParseAmbiguity(profile));
  allIssues.push(...checkInvalidDateCandidate(profile));
  allIssues.push(...checkDateOrder(profile));
  allIssues.push(...checkConstantColumn(profile));
  allIssues.push(...checkHighCardinalityCategory(profile));
  allIssues.push(...checkOutlierIqrFlag(profile));
  allIssues.push(...checkPossibleOutcomeLeakage(profile));

  return allIssues;
}

export { RULE_VERSION };
