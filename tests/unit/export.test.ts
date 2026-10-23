import { describe, it, expect } from 'vitest';
import { buildJsonReport, buildIssuesCsv, buildHtmlReport } from '@lib/export';
import { runAllChecks, RULE_VERSION } from '@lib/rules';
import { CheckResult, DatasetProfile } from '@/types/index';

const profile: DatasetProfile = {
  fileName: 'report-test.csv',
  fileSize: 512,
  format: 'csv',
  headers: ['id', 'name', 'value'],
  rows: [
    ['1', 'Alice', '100'],
    ['1', 'Alice', '100'],
    ['2', '', 'bad,number'],
  ],
  totalRows: 3,
  totalColumns: 3,
  headerRowIndex: 0,
  idColumnIndex: 0,
  allowedMissingMarkers: ['NA'],
  isLongitudinal: false,
  parseTimestamp: 1700000000000,
};

const result: CheckResult = {
  datasetProfile: profile,
  issues: runAllChecks(profile),
  ruleVersion: RULE_VERSION,
  appVersion: '1.0.0',
  runTimestamp: 1700000000000,
  config: {
    headerRowIndex: 0,
    idColumnIndex: 0,
    missingMarkers: ['NA'],
    isLongitudinal: false,
  },
};

describe('buildJsonReport', () => {
  it('produces valid JSON that can be re-read with the same schema', () => {
    const parsed = JSON.parse(buildJsonReport(result));
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.ruleVersion).toBe(RULE_VERSION);
    expect(parsed.appVersion).toBe('1.0.0');
    expect(parsed.fileName).toBe('report-test.csv');
    expect(Array.isArray(parsed.issues)).toBe(true);
  });

  it('includes required report fields per plan §7', () => {
    const parsed = JSON.parse(buildJsonReport(result));
    expect(parsed.runTimestamp).toBe('2023-11-14T22:13:20.000Z');
    expect(parsed.config).toBeDefined();
    expect(parsed.profile.totalRows).toBe(3);
    expect(parsed.profile.totalColumns).toBe(3);
    expect(parsed.issueCounts.total).toBe(result.issues.length);
    expect(typeof parsed.limitations).toBe('string');
    expect(parsed.limitations).toContain('does not modify the source data');
  });

  it('does not embed raw row data', () => {
    const json = buildJsonReport(result);
    expect(json).not.toContain('"rows"');
    expect(json).not.toContain('Alice');
  });
});

describe('buildIssuesCsv', () => {
  it('produces a header row plus one line per issue', () => {
    const csv = buildIssuesCsv(result);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('rule_id,severity,columns,affected_count,denominator,sample_rows');
    expect(lines.length).toBe(result.issues.length + 1);
  });

  it('escapes commas and quotes in column names', () => {
    const special: CheckResult = {
      ...result,
      issues: [
        {
          ruleId: 'TEST',
          severity: 'info',
          titleKey: 't',
          descriptionKey: 'd',
          columnNames: ['col,with,commas', 'quote"col'],
          rowIndexesSample: [1, 2],
          affectedCount: 2,
          details: {},
          actionKey: 'a',
        },
      ],
    };
    const csv = buildIssuesCsv(special);
    expect(csv).toContain('"col,with,commas; quote""col"');
  });
});

describe('buildHtmlReport', () => {
  it('contains tool identity, versions, file name, and issue groups', () => {
    const html = buildHtmlReport(result);
    expect(html).toContain('Clinical Dataset Checker');
    expect(html).toContain(RULE_VERSION);
    expect(html).toContain('report-test.csv');
    expect(html).toContain('Blockers');
  });

  it('escapes HTML special characters in data-derived content', () => {
    const xssProfile: DatasetProfile = {
      ...profile,
      fileName: '<script>alert(1)</script>.csv',
      headers: ['<b>id</b>', 'name', 'value'],
    };
    const xssResult: CheckResult = {
      ...result,
      datasetProfile: xssProfile,
      issues: runAllChecks(xssProfile),
    };
    const html = buildHtmlReport(xssResult);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes the limitations statement', () => {
    const html = buildHtmlReport(result);
    expect(html).toContain('does not modify the source data');
  });

  it('states that severity is not patient condition', () => {
    const html = buildHtmlReport(result);
    expect(html).toContain('not patient condition');
  });
});
