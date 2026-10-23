import { describe, it, expect } from 'vitest';
import {
  checkHeaderEmpty,
  checkHeaderDuplicate,
  checkRowEmpty,
  checkColumnEmpty,
  checkMissingValues,
  checkExactDuplicateRows,
  checkDuplicateId,
  checkMixedTypes,
  checkNumericParseAmbiguity,
  checkInvalidDateCandidate,
  checkDateOrder,
  checkConstantColumn,
  checkHighCardinalityCategory,
  checkOutlierIqrFlag,
  checkPossibleOutcomeLeakage,
  runAllChecks,
  quantileType7,
  parseISODate,
} from '@lib/rules';
import { DatasetProfile, CellValue } from '@/types/index';

const createTestProfile = (overrides: Partial<DatasetProfile> = {}): DatasetProfile => ({
  fileName: 'test.csv',
  fileSize: 1024,
  format: 'csv',
  headers: ['id', 'name', 'value'],
  rows: [
    ['1', 'Alice', '100'],
    ['2', 'Bob', '200'],
  ],
  totalRows: 2,
  totalColumns: 3,
  headerRowIndex: 0,
  allowedMissingMarkers: ['NA', 'N/A'],
  isLongitudinal: false,
  parseTimestamp: 1700000000000,
  ...overrides,
});

const withRows = (rows: CellValue[][], overrides: Partial<DatasetProfile> = {}) =>
  createTestProfile({ rows, totalRows: rows.length, ...overrides });

describe('quantileType7 (R Type 7 oracle values)', () => {
  it('computes Q1/Q3 for n=5: h = (n-1)*p lands exactly on indexes', () => {
    const sorted = [1, 2, 3, 4, 5];
    expect(quantileType7(sorted, 0.25)).toBe(2);
    expect(quantileType7(sorted, 0.75)).toBe(4);
    expect(quantileType7(sorted, 0.5)).toBe(3);
  });

  it('interpolates for n=4: Q1 = 1.75, Q3 = 3.25', () => {
    const sorted = [1, 2, 3, 4];
    expect(quantileType7(sorted, 0.25)).toBe(1.75);
    expect(quantileType7(sorted, 0.75)).toBe(3.25);
  });

  it('interpolates for n=10: Q1 = 3.25, Q3 = 7.75', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(quantileType7(sorted, 0.25)).toBe(3.25);
    expect(quantileType7(sorted, 0.75)).toBe(7.75);
  });

  it('returns the only element for n=1 and NaN for n=0', () => {
    expect(quantileType7([5], 0.25)).toBe(5);
    expect(quantileType7([5], 0.75)).toBe(5);
    expect(quantileType7([], 0.25)).toBeNaN();
  });

  it('handles fractional positions between non-adjacent values', () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70];
    // h = 6 * 0.25 = 1.5 -> 20 + 0.5 * (30 - 20) = 25
    expect(quantileType7(sorted, 0.25)).toBe(25);
    // h = 6 * 0.75 = 4.5 -> 50 + 0.5 * (60 - 50) = 55
    expect(quantileType7(sorted, 0.75)).toBe(55);
  });
});

describe('parseISODate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(parseISODate('2026-01-15')).not.toBeNull();
  });
  it('accepts YYYY/MM/DD', () => {
    expect(parseISODate('2026/10/19')).not.toBeNull();
  });
  it('rejects ambiguous day-first/month-first formats', () => {
    expect(parseISODate('01/02/2026')).toBeNull();
    expect(parseISODate('15-01-2026')).toBeNull();
  });
  it('rejects invalid calendar dates', () => {
    expect(parseISODate('2026-13-01')).toBeNull();
    expect(parseISODate('2026-02-31')).toBeNull();
  });
  it('rejects non-strings and non-dates', () => {
    expect(parseISODate(45000)).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate('hello')).toBeNull();
  });
});

describe('checkHeaderEmpty', () => {
  it('detects a single empty header', () => {
    const issues = checkHeaderEmpty(createTestProfile({ headers: ['id', '', 'value'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('HEADER_EMPTY');
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].affectedCount).toBe(1);
  });

  it('detects multiple empty headers with correct count', () => {
    const issues = checkHeaderEmpty(createTestProfile({ headers: ['', '', 'value'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(2);
  });

  it('treats whitespace-only headers as empty', () => {
    const issues = checkHeaderEmpty(createTestProfile({ headers: ['id', '   ', 'value'] }));
    expect(issues).toHaveLength(1);
  });

  it('does not flag non-empty headers', () => {
    expect(checkHeaderEmpty(createTestProfile())).toHaveLength(0);
  });

  it('reports column positions in details', () => {
    const issues = checkHeaderEmpty(createTestProfile({ headers: ['id', '', ''] }));
    expect(issues[0].details.columnIndices).toBe('2,3');
  });
});

describe('checkHeaderDuplicate (blocker rule - extended coverage)', () => {
  it('detects exact duplicate headers as blocker', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['id', 'name', 'id'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('HEADER_DUPLICATE');
    expect(issues[0].severity).toBe('blocker');
    expect(issues[0].affectedCount).toBe(2);
  });

  it('detects case-insensitive duplicates', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['ID', 'name', 'id'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(2);
  });

  it('detects duplicates differing only by surrounding whitespace', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['id', ' id ', 'value'] }));
    expect(issues).toHaveLength(1);
  });

  it('counts three-way duplicates correctly', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['a', 'a', 'a'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(3);
    expect(issues[0].details.duplicateCount).toBe(1);
  });

  it('handles multiple independent duplicate groups', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['a', 'b', 'a', 'b'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(4);
    expect(issues[0].details.duplicateCount).toBe(2);
  });

  it('does not flag unique headers', () => {
    expect(checkHeaderDuplicate(createTestProfile())).toHaveLength(0);
  });

  it('does not flag similar-but-distinct headers', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['id', 'id_2', 'id3'] }));
    expect(issues).toHaveLength(0);
  });

  it('lists the duplicate names in details', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['x', 'y', 'x'] }));
    expect(String(issues[0].details.duplicateList)).toContain('x');
  });

  it('handles Chinese header duplicates', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['年龄', '性别', '年龄'] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('blocker');
  });

  it('provides an actionKey for user guidance', () => {
    const issues = checkHeaderDuplicate(createTestProfile({ headers: ['a', 'a', 'b'] }));
    expect(issues[0].actionKey).toBe('check.header_duplicate.action');
  });
});

describe('checkRowEmpty', () => {
  it('detects one completely empty row with 1-based index', () => {
    const issues = checkRowEmpty(
      withRows([
        ['1', 'Alice', '100'],
        ['', '', ''],
        ['2', 'Bob', '200'],
      ])
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
    expect(issues[0].rowIndexesSample).toEqual([2]);
  });

  it('treats whitespace-only cells as empty', () => {
    const issues = checkRowEmpty(withRows([['1', 'a', '1'], ['  ', ' ', '\t']]));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
  });

  it('treats null cells as empty', () => {
    const issues = checkRowEmpty(withRows([[null, null, null], ['1', 'a', '1']]));
    expect(issues).toHaveLength(1);
    expect(issues[0].rowIndexesSample).toEqual([1]);
  });

  it('does not flag rows with a zero value', () => {
    const issues = checkRowEmpty(withRows([[0, '', '']]));
    expect(issues).toHaveLength(0);
  });

  it('counts multiple empty rows and provides denominator', () => {
    const issues = checkRowEmpty(
      withRows([
        ['', '', ''],
        ['1', 'a', '1'],
        ['', '', ''],
        ['', '', ''],
      ])
    );
    expect(issues[0].affectedCount).toBe(3);
    expect(issues[0].denominator).toBe(4);
  });
});

describe('checkColumnEmpty', () => {
  it('detects a fully empty column', () => {
    const issues = checkColumnEmpty(
      createTestProfile({
        headers: ['id', 'empty', 'value'],
        rows: [
          ['1', '', '100'],
          ['2', '', '200'],
        ],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].columnNames).toEqual(['empty']);
  });

  it('detects columns that are entirely null', () => {
    const issues = checkColumnEmpty(
      createTestProfile({
        rows: [
          ['1', null, '100'],
          ['2', null, '200'],
        ],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].columnNames).toEqual(['name']);
  });

  it('does not flag a column containing only zeros', () => {
    const issues = checkColumnEmpty(
      createTestProfile({
        rows: [
          ['1', 0, '100'],
          ['2', 0, '200'],
        ],
      })
    );
    expect(issues).toHaveLength(0);
  });

  it('does not flag columns with at least one value', () => {
    const issues = checkColumnEmpty(
      createTestProfile({
        rows: [
          ['1', '', '100'],
          ['2', 'x', '200'],
        ],
      })
    );
    expect(issues).toHaveLength(0);
  });

  it('detects multiple empty columns', () => {
    const issues = checkColumnEmpty(
      createTestProfile({
        rows: [
          ['', '', '1'],
          ['', '', '2'],
        ],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(2);
  });
});

describe('checkMissingValues', () => {
  it('matches markers case-insensitively (regression: NA vs na)', () => {
    const issues = checkMissingValues(
      createTestProfile({
        rows: [
          ['1', 'na', '100'],
          ['2', 'NA', '200'],
          ['3', 'Na', '300'],
        ],
        totalRows: 3,
        allowedMissingMarkers: ['NA'],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(3);
  });

  it('trims markers and cell values before matching', () => {
    const issues = checkMissingValues(
      withRows([['1', ' NA ', '100']], { allowedMissingMarkers: ['NA'] })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
  });

  it('never treats 0 or "0" as missing', () => {
    const issues = checkMissingValues(withRows([[0, '0', '1']]));
    expect(issues).toHaveLength(0);
  });

  it('does not treat unlisted codes as missing by default', () => {
    const issues = checkMissingValues(
      withRows([['1', 'unknown', '100']], { allowedMissingMarkers: ['NA'] })
    );
    expect(issues).toHaveLength(0);
  });

  it('supports user-added markers including Chinese codes', () => {
    const issues = checkMissingValues(
      withRows([['1', '未查', '100'], ['2', '未测', '200']], {
        allowedMissingMarkers: ['未查', '未测'],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(2);
  });

  it('computes per-column rates with total-cells denominator', () => {
    const issues = checkMissingValues(
      withRows(
        [
          ['1', '', '100'],
          ['2', 'x', ''],
        ],
        { allowedMissingMarkers: [] }
      )
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(2);
    expect(issues[0].denominator).toBe(6);
    expect(issues[0].details['name_missing']).toBe(1);
    expect(issues[0].details['value_missing']).toBe(1);
  });
});

describe('checkExactDuplicateRows', () => {
  it('detects duplicated rows, counting only repeats after first occurrence', () => {
    const issues = checkExactDuplicateRows(
      withRows([
        ['1', 'Alice', '100'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200'],
      ])
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
    expect(issues[0].rowIndexesSample).toEqual([2]);
  });

  it('normalizes surrounding whitespace for comparison', () => {
    const issues = checkExactDuplicateRows(
      withRows([
        ['1', 'Alice', '100'],
        ['1', ' Alice ', '100'],
      ])
    );
    expect(issues).toHaveLength(1);
  });

  it('handles three copies of the same row as two duplicates', () => {
    const issues = checkExactDuplicateRows(
      withRows([
        ['1', 'a', '1'],
        ['1', 'a', '1'],
        ['1', 'a', '1'],
      ])
    );
    expect(issues[0].affectedCount).toBe(2);
    expect(issues[0].details.duplicateSetCount).toBe(1);
  });

  it('does not flag distinct rows', () => {
    expect(checkExactDuplicateRows(createTestProfile())).toHaveLength(0);
  });

  it('distinguishes numeric 1 from string "1"', () => {
    const issues = checkExactDuplicateRows(
      withRows([
        [1, 'a', 'x'],
        ['1', 'a', 'x'],
      ])
    );
    // Both stringify to "1" — this documents the chosen comparison semantics.
    expect(issues).toHaveLength(1);
  });
});

describe('checkDuplicateId (blocker-capable rule - extended coverage)', () => {
  const dupProfile = (isLongitudinal: boolean) =>
    createTestProfile({
      rows: [
        ['1', 'Alice', '100'],
        ['1', 'Alice2', '150'],
        ['2', 'Bob', '200'],
      ],
      totalRows: 3,
      idColumnIndex: 0,
      isLongitudinal,
    });

  it('is a blocker when one-row-per-participant is declared (default)', () => {
    const issues = checkDuplicateId(dupProfile(false));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('blocker');
  });

  it('is a warning when longitudinal design is declared', () => {
    const issues = checkDuplicateId(dupProfile(true));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
  });

  it('counts distinct duplicated ID values, not rows', () => {
    const issues = checkDuplicateId(dupProfile(false));
    expect(issues[0].affectedCount).toBe(1);
    expect(issues[0].details.totalAffectedRows).toBe(2);
  });

  it('returns no issue when no ID column is specified', () => {
    expect(checkDuplicateId(createTestProfile())).toHaveLength(0);
  });

  it('returns no issue for out-of-range ID column index', () => {
    const issues = checkDuplicateId(createTestProfile({ idColumnIndex: 99 }));
    expect(issues).toHaveLength(0);
  });

  it('ignores blank ID cells', () => {
    const issues = checkDuplicateId(
      createTestProfile({
        rows: [
          ['', 'a', '1'],
          ['', 'b', '2'],
        ],
        totalRows: 2,
        idColumnIndex: 0,
      })
    );
    expect(issues).toHaveLength(0);
  });

  it('trims ID values before comparison', () => {
    const issues = checkDuplicateId(
      createTestProfile({
        rows: [
          ['P01', 'a', '1'],
          [' P01 ', 'b', '2'],
        ],
        totalRows: 2,
        idColumnIndex: 0,
      })
    );
    expect(issues).toHaveLength(1);
  });

  it('reports sample row indexes of affected rows', () => {
    const issues = checkDuplicateId(dupProfile(false));
    expect(issues[0].rowIndexesSample).toEqual([1, 2]);
  });

  it('names the ID column in columnNames', () => {
    const issues = checkDuplicateId(dupProfile(false));
    expect(issues[0].columnNames).toEqual(['id']);
  });

  it('handles multiple duplicated IDs', () => {
    const issues = checkDuplicateId(
      createTestProfile({
        rows: [
          ['1', 'a', '1'],
          ['1', 'b', '2'],
          ['2', 'c', '3'],
          ['2', 'd', '4'],
        ],
        totalRows: 4,
        idColumnIndex: 0,
      })
    );
    expect(issues[0].affectedCount).toBe(2);
  });
});

describe('checkMixedTypes', () => {
  it('flags a column mixing numbers and free text', () => {
    const issues = checkMixedTypes(
      withRows([
        ['1', 'Alice', '100'],
        ['2', 'Bob', 'text'],
        ['3', 'Carol', '150'],
      ])
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].columnNames).toContain('value');
  });

  it('does not flag a uniformly numeric-string column', () => {
    const issues = checkMixedTypes(
      withRows([
        ['1', 'a', '100'],
        ['2', 'b', '200'],
      ])
    );
    expect(issues).toHaveLength(0);
  });

  it('ignores blank cells when judging type mix', () => {
    const issues = checkMixedTypes(
      withRows([
        ['1', '', '100'],
        ['2', '', '200'],
      ])
    );
    expect(issues).toHaveLength(0);
  });

  it('detects numbers mixed with dates', () => {
    const issues = checkMixedTypes(
      withRows([
        ['1', '2026-01-15', 'x'],
        ['2', '42', 'y'],
        ['3', '2026-01-17', 'z'],
        ['4', '43', 'w'],
      ])
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].columnNames).toContain('name');
  });

  it('does not flag a column where a tiny fraction deviates', () => {
    const rows: CellValue[][] = Array.from({ length: 20 }, (_, i) => [String(i), 'text', '100']);
    rows[0][2] = 'oops';
    const issues = checkMixedTypes(withRows(rows));
    expect(issues).toHaveLength(0);
  });
});

describe('checkNumericParseAmbiguity', () => {
  it('flags thousands-separator style values like 1,234', () => {
    const issues = checkNumericParseAmbiguity(
      withRows([
        ['1', 'a', '1,234'],
        ['2', 'b', '2,500'],
      ])
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(2);
  });

  it('flags comma-decimal style values like 1,23', () => {
    const issues = checkNumericParseAmbiguity(withRows([['1', 'a', '1,23']]));
    expect(issues).toHaveLength(1);
  });

  it('does not flag plain decimals or scientific notation', () => {
    const issues = checkNumericParseAmbiguity(
      withRows([
        ['1', 'a', '1.23'],
        ['2', 'b', '1e5'],
        ['3', 'c', '-42'],
      ])
    );
    expect(issues).toHaveLength(0);
  });

  it('does not flag pure text', () => {
    const issues = checkNumericParseAmbiguity(withRows([['1', 'a', 'hello world']]));
    expect(issues).toHaveLength(0);
  });

  it('provides example values in details', () => {
    const issues = checkNumericParseAmbiguity(withRows([['1', 'a', '1,234']]));
    expect(String(issues[0].details.value)).toContain('1,234');
  });
});

describe('checkInvalidDateCandidate', () => {
  const dateProfile = (rows: CellValue[][]) =>
    createTestProfile({
      headers: ['id', 'visit_date', 'value'],
      rows,
      totalRows: rows.length,
      dateColumnIndexes: [1],
    });

  it('returns nothing when no date columns are designated', () => {
    const issues = checkInvalidDateCandidate(withRows([['1', 'not-a-date', '1']]));
    expect(issues).toHaveLength(0);
  });

  it('accepts clean ISO dates without flagging', () => {
    const issues = checkInvalidDateCandidate(dateProfile([['1', '2026-01-15', '1']]));
    expect(issues).toHaveLength(0);
  });

  it('flags ambiguous day/month formats without guessing order', () => {
    const issues = checkInvalidDateCandidate(dateProfile([['1', '01/02/2026', '1']]));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
    expect(String(issues[0].details.visit_date)).toContain('ambiguous_order:1');
  });

  it('flags plausible Excel serial numbers for user confirmation', () => {
    const issues = checkInvalidDateCandidate(dateProfile([['1', 45000, '1']]));
    expect(issues).toHaveLength(1);
    expect(String(issues[0].details.visit_date)).toContain('excel_serial:1');
  });

  it('flags unparseable values and skips user-defined missing markers', () => {
    const issues = checkInvalidDateCandidate(
      createTestProfile({
        headers: ['id', 'visit_date', 'value'],
        rows: [
          ['1', 'NA', '1'],
          ['2', 'garbage', '2'],
        ],
        totalRows: 2,
        dateColumnIndexes: [1],
        allowedMissingMarkers: ['NA'],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
    expect(String(issues[0].details.visit_date)).toContain('unparseable:1');
  });

  it('ignores out-of-range date column indexes', () => {
    const issues = checkInvalidDateCandidate(
      createTestProfile({ dateColumnIndexes: [99] })
    );
    expect(issues).toHaveLength(0);
  });
});

describe('checkDateOrder', () => {
  const orderProfile = (rows: CellValue[][]) =>
    createTestProfile({
      headers: ['id', 'start', 'end'],
      rows,
      totalRows: rows.length,
      startDateColumnIndex: 1,
      endDateColumnIndex: 2,
    });

  it('flags rows where end date precedes start date', () => {
    const issues = checkDateOrder(orderProfile([['1', '2026-02-15', '2026-01-10']]));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
    expect(issues[0].rowIndexesSample).toEqual([1]);
  });

  it('does not flag correct ordering', () => {
    const issues = checkDateOrder(orderProfile([['1', '2026-01-10', '2026-02-15']]));
    expect(issues).toHaveLength(0);
  });

  it('does not flag equal dates', () => {
    const issues = checkDateOrder(orderProfile([['1', '2026-01-10', '2026-01-10']]));
    expect(issues).toHaveLength(0);
  });

  it('skips rows with unparseable dates instead of guessing', () => {
    const issues = checkDateOrder(orderProfile([['1', '01/02/2026', '2026-01-10']]));
    expect(issues).toHaveLength(0);
  });

  it('returns nothing when start/end columns are not designated', () => {
    const issues = checkDateOrder(withRows([['1', '2026-02-15', '2026-01-10']]));
    expect(issues).toHaveLength(0);
  });

  it('reports both involved columns', () => {
    const issues = checkDateOrder(orderProfile([['1', '2026-02-15', '2026-01-10']]));
    expect(issues[0].columnNames).toEqual(['start', 'end']);
  });
});

describe('checkConstantColumn', () => {
  it('detects a single-valued column', () => {
    const issues = checkConstantColumn(
      createTestProfile({
        headers: ['status', 'name', 'value'],
        rows: [
          ['active', 'Alice', '100'],
          ['active', 'Bob', '200'],
        ],
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].columnNames).toEqual(['status']);
    expect(issues[0].severity).toBe('info');
  });

  it('ignores empty cells when counting distinct values', () => {
    const issues = checkConstantColumn(
      createTestProfile({
        headers: ['status', 'name', 'value'],
        rows: [
          ['active', '', '100'],
          ['active', 'x', ''],
        ],
      })
    );
    expect(issues).toHaveLength(1);
  });

  it('does not flag multi-valued columns', () => {
    expect(checkConstantColumn(createTestProfile())).toHaveLength(0);
  });

  it('does not flag fully empty columns', () => {
    const issues = checkConstantColumn(
      createTestProfile({
        rows: [
          ['', 'a', '1'],
          ['', 'b', '2'],
        ],
      })
    );
    expect(issues).toHaveLength(0);
  });

  it('detects multiple constant columns with count', () => {
    const issues = checkConstantColumn(
      createTestProfile({
        headers: ['c1', 'c2', 'v'],
        rows: [
          ['x', 'y', '1'],
          ['x', 'y', '2'],
        ],
        totalColumns: 3,
      })
    );
    expect(issues[0].affectedCount).toBe(2);
  });
});

describe('checkHighCardinalityCategory', () => {
  const manyUniqueTextRows = (n: number): CellValue[][] =>
    Array.from({ length: n }, (_, i) => [String(i), `note-${i}`, '1']);

  it('flags high-cardinality free-text columns', () => {
    const issues = checkHighCardinalityCategory(withRows(manyUniqueTextRows(30)));
    expect(issues).toHaveLength(1);
    expect(issues[0].columnNames).toEqual(['name']);
  });

  it('does not flag numeric columns even when every value is unique', () => {
    const rows: CellValue[][] = Array.from({ length: 30 }, (_, i) => [
      String(i),
      String(i * 7),
      'x',
    ]);
    const issues = checkHighCardinalityCategory(withRows(rows));
    expect(issues).toHaveLength(0);
  });

  it('skips the user-designated ID column', () => {
    const issues = checkHighCardinalityCategory(
      withRows(manyUniqueTextRows(30), { idColumnIndex: 1 })
    );
    expect(issues).toHaveLength(0);
  });

  it('does not flag low-cardinality categorical columns', () => {
    expect(checkHighCardinalityCategory(createTestProfile())).toHaveLength(0);
  });

  it('requires more than 20 unique values', () => {
    const rows: CellValue[][] = Array.from({ length: 15 }, (_, i) => [String(i), `u-${i}`, '1']);
    const issues = checkHighCardinalityCategory(withRows(rows));
    expect(issues).toHaveLength(0);
  });
});

describe('checkOutlierIqrFlag', () => {
  it('flags values outside Q1 - 1.5*IQR and Q3 + 1.5*IQR (Type 7 oracle)', () => {
    // values 1..10 plus 100: Q1 = 3.5 (h = 2.5), Q3 = 8.5, IQR = 5,
    // bounds = [-4, 16] -> only 100 flagged.
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100];
    const rows: CellValue[][] = values.map((v, i) => [String(i), 'x', v]);
    const issues = checkOutlierIqrFlag(withRows(rows));
    expect(issues).toHaveLength(1);
    expect(issues[0].affectedCount).toBe(1);
    expect(issues[0].rowIndexesSample).toEqual([11]);
    expect(issues[0].details.quantileDefinition).toBe('R Type 7');
  });

  it('does not flag when IQR is zero', () => {
    const rows: CellValue[][] = Array.from({ length: 10 }, () => ['1', 'x', 5]);
    expect(checkOutlierIqrFlag(withRows(rows))).toHaveLength(0);
  });

  it('requires at least 4 numeric values', () => {
    const rows: CellValue[][] = [
      ['1', 'x', 1],
      ['2', 'x', 2],
      ['3', 'x', 100],
    ];
    expect(checkOutlierIqrFlag(withRows(rows))).toHaveLength(0);
  });

  it('skips predominantly non-numeric columns', () => {
    const rows: CellValue[][] = [
      ['1', 'x', 1],
      ['2', 'x', 2],
      ['3', 'x', 3],
      ['4', 'x', 4],
      ['5', 'x', 'text-a'],
      ['6', 'x', 'text-b'],
    ];
    expect(checkOutlierIqrFlag(withRows(rows))).toHaveLength(0);
  });

  it('does not flag clean datasets', () => {
    const rows: CellValue[][] = Array.from({ length: 10 }, (_, i) => ['1', 'x', i + 1]);
    expect(checkOutlierIqrFlag(withRows(rows))).toHaveLength(0);
  });
});

describe('checkPossibleOutcomeLeakage', () => {
  it('flags columns containing outcome-like keywords', () => {
    const issues = checkPossibleOutcomeLeakage(
      createTestProfile({ headers: ['id', 'treatment', 'outcome_status'] })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].columnNames).toEqual(['outcome_status']);
  });

  it('matches keywords case-insensitively', () => {
    const issues = checkPossibleOutcomeLeakage(
      createTestProfile({ headers: ['id', 'a', 'DIAGNOSIS'] })
    );
    expect(issues).toHaveLength(1);
  });

  it('flags result/endpoint-like names', () => {
    const issues = checkPossibleOutcomeLeakage(
      createTestProfile({ headers: ['result_flag', 'primary_endpoint', 'x'] })
    );
    expect(issues[0].affectedCount).toBe(2);
  });

  it('never asserts leakage as fact (warning only, never blocker)', () => {
    const issues = checkPossibleOutcomeLeakage(
      createTestProfile({ headers: ['outcome', 'diagnosis', 'x'] })
    );
    issues.forEach((i) => expect(i.severity).not.toBe('blocker'));
  });

  it('does not flag neutral column names', () => {
    expect(checkPossibleOutcomeLeakage(createTestProfile())).toHaveLength(0);
  });
});

describe('runAllChecks determinism', () => {
  it('produces identical output for identical input across 3 runs', () => {
    const profile = createTestProfile({
      headers: ['id', 'name', 'value'],
      rows: [
        ['1', 'Alice', '100'],
        ['1', 'Alice', '100'],
        ['2', '', '1,234'],
        ['3', 'Bob', 'not-a-number'],
      ],
      totalRows: 4,
      idColumnIndex: 0,
    });

    const run1 = JSON.stringify(runAllChecks(profile));
    const run2 = JSON.stringify(runAllChecks(profile));
    const run3 = JSON.stringify(runAllChecks(profile));
    expect(run1).toBe(run2);
    expect(run2).toBe(run3);
  });

  it('produces stable ruleIds with expected severities', () => {
    const profile = createTestProfile({
      headers: ['id', 'id', 'value'],
      rows: [
        ['1', 'a', '100'],
        ['2', 'b', '200'],
      ],
      totalRows: 2,
    });
    const issues = runAllChecks(profile);
    const dup = issues.find((i) => i.ruleId === 'HEADER_DUPLICATE');
    expect(dup?.severity).toBe('blocker');
  });
});
