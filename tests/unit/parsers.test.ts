import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseCSVText, MAX_ROWS, MAX_COLUMNS } from '@lib/parsers';
import { DEFAULT_IMPORT_CONFIG, ImportConfig } from '@/types/index';

const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf-8');

const config = (overrides: Partial<ImportConfig> = {}): ImportConfig => ({
  ...DEFAULT_IMPORT_CONFIG,
  ...overrides,
});

describe('parseCSVText', () => {
  it('parses a clean fixture with exact row/column counts', () => {
    const result = parseCSVText(fixture('clean.csv'), 'clean.csv', 100, config());
    expect(result.success).toBe(true);
    expect(result.data?.totalRows).toBe(30);
    expect(result.data?.totalColumns).toBe(6);
    expect(result.data?.headers).toEqual([
      'participant_id',
      'age',
      'gender',
      'height_cm',
      'weight_kg',
      'group',
    ]);
  });

  it('detects the comma separator and reports it', () => {
    const result = parseCSVText('a,b\n1,2\n', 'x.csv', 8, config());
    expect(result.success).toBe(true);
    expect(result.detectedSeparator).toBe(',');
  });

  it('auto-detects semicolon separators', () => {
    const result = parseCSVText('a;b;c\n1;2;3\n4;5;6\n', 'x.csv', 20, config());
    expect(result.success).toBe(true);
    expect(result.detectedSeparator).toBe(';');
    expect(result.data?.totalColumns).toBe(3);
  });

  it('respects a user-forced separator override', () => {
    const result = parseCSVText('a;b\n1;2\n', 'x.csv', 8, config({ separator: ';' }));
    expect(result.success).toBe(true);
    expect(result.data?.totalColumns).toBe(2);
  });

  it('rejects a completely empty file with FILE_EMPTY', () => {
    const result = parseCSVText('', 'empty.csv', 0, config());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FILE_EMPTY');
  });

  it('rejects a headers-only file with FILE_EMPTY', () => {
    const result = parseCSVText('a,b,c\n', 'x.csv', 6, config());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FILE_EMPTY');
  });

  it('rejects an out-of-range header row index', () => {
    const result = parseCSVText('a,b\n1,2\n', 'x.csv', 8, config({ headerRowIndex: 10 }));
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_HEADER_ROW');
  });

  it('uses a non-zero header row when configured', () => {
    const result = parseCSVText(
      'Study metadata line\na,b\n1,2\n',
      'x.csv',
      25,
      config({ headerRowIndex: 1 })
    );
    expect(result.success).toBe(true);
    expect(result.data?.headers).toEqual(['a', 'b']);
    expect(result.data?.totalRows).toBe(1);
  });

  it('enforces the row limit', () => {
    const header = 'a\n';
    const body = '1\n'.repeat(MAX_ROWS + 1);
    const result = parseCSVText(header + body, 'big.csv', body.length, config());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ROW_COLUMN_LIMIT');
  });

  it('enforces the column limit', () => {
    const cols = Array.from({ length: MAX_COLUMNS + 1 }, (_, i) => `c${i}`).join(',');
    const row = Array.from({ length: MAX_COLUMNS + 1 }, () => '1').join(',');
    const result = parseCSVText(`${cols}\n${row}\n`, 'wide.csv', 5000, config());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ROW_COLUMN_LIMIT');
  });

  it('keeps raw values without implicit numeric conversion (1,234 stays text)', () => {
    const result = parseCSVText(fixture('numerics.csv'), 'numerics.csv', 200, config());
    expect(result.success).toBe(true);
    expect(result.data?.rows[0][1]).toBe('1,234');
    expect(result.data?.rows[1][1]).toBe('1.234');
  });

  it('parses Chinese headers and content unchanged', () => {
    const result = parseCSVText(fixture('i18n-headers.csv'), 'i18n.csv', 200, config());
    expect(result.success).toBe(true);
    expect(result.data?.headers[0]).toBe('受试者编号');
    expect(result.data?.rows[0][3]).toBe('无');
  });

  it('parses the bad-headers fixture preserving duplicate and empty headers', () => {
    const result = parseCSVText(fixture('bad-headers.csv'), 'bad.csv', 100, config());
    expect(result.success).toBe(true);
    expect(result.data?.headers).toEqual(['id', 'name', 'id', '', 'empty_col']);
  });

  it('never mutates the input text', () => {
    const text = fixture('clean.csv');
    const copy = text.slice();
    parseCSVText(text, 'clean.csv', 100, config());
    expect(text).toBe(copy);
  });

  it('handles UTF-8 BOM without corrupting the first header', () => {
    const result = parseCSVText('﻿a,b\n1,2\n', 'bom.csv', 10, config());
    expect(result.success).toBe(true);
    // Papa strips a leading BOM; the first header must be exactly "a".
    expect(result.data?.headers[0]).toBe('a');
  });
});
