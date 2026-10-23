import { CheckResult, Issue } from '@/types/index';

const SCHEMA_VERSION = '1.0.0';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString();
}

export function buildJsonReport(result: CheckResult): string {
  return JSON.stringify(
    {
      schemaVersion: SCHEMA_VERSION,
      tool: 'Clinical Dataset Checker',
      appVersion: result.appVersion,
      ruleVersion: result.ruleVersion,
      runTimestamp: formatTimestamp(result.runTimestamp),
      fileName: result.datasetProfile.fileName,
      config: result.config,
      profile: {
        format: result.datasetProfile.format,
        sheetName: result.datasetProfile.sheetName ?? null,
        totalRows: result.datasetProfile.totalRows,
        totalColumns: result.datasetProfile.totalColumns,
        headerRowIndex: result.datasetProfile.headerRowIndex,
        headers: result.datasetProfile.headers,
      },
      issueCounts: {
        blocker: result.issues.filter((i) => i.severity === 'blocker').length,
        warning: result.issues.filter((i) => i.severity === 'warning').length,
        info: result.issues.filter((i) => i.severity === 'info').length,
        total: result.issues.length,
      },
      issues: result.issues,
      limitations:
        'This report does not certify that the data is suitable for any particular statistical analysis. ' +
        'It provides no clinical interpretation and does not modify the source data.',
    },
    null,
    2
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildIssuesCsv(result: CheckResult): string {
  const header = 'rule_id,severity,columns,affected_count,denominator,sample_rows';
  const lines = result.issues.map((issue: Issue) =>
    [
      csvEscape(issue.ruleId),
      issue.severity,
      csvEscape(issue.columnNames.join('; ')),
      String(issue.affectedCount),
      issue.denominator !== undefined ? String(issue.denominator) : '',
      csvEscape(issue.rowIndexesSample.join('; ')),
    ].join(',')
  );
  return [header, ...lines].join('\n');
}

function renderIssueHtml(issue: Issue): string {
  const detailsRows = Object.entries(issue.details)
    .map(
      ([k, v]) =>
        `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v === null ? 'N/A' : String(v))}</td></tr>`
    )
    .join('');
  return `
    <div class="issue ${issue.severity}">
      <h3><span class="badge ${issue.severity}">${issue.severity.toUpperCase()}</span> ${escapeHtml(issue.ruleId)}</h3>
      <p><strong>Columns:</strong> ${escapeHtml(issue.columnNames.join(', ') || 'N/A')}</p>
      <p><strong>Affected:</strong> ${issue.affectedCount}${
        issue.denominator !== undefined ? ` / ${issue.denominator}` : ''
      }</p>
      <p><strong>Sample data rows (1-based):</strong> ${
        issue.rowIndexesSample.length > 0 ? issue.rowIndexesSample.join(', ') : 'N/A'
      }</p>
      <table><tbody>${detailsRows}</tbody></table>
    </div>`;
}

export function buildHtmlReport(result: CheckResult): string {
  const blockers = result.issues.filter((i) => i.severity === 'blocker');
  const warnings = result.issues.filter((i) => i.severity === 'warning');
  const infos = result.issues.filter((i) => i.severity === 'info');

  const section = (title: string, list: Issue[]): string =>
    list.length === 0
      ? ''
      : `<h2>${title} (${list.length})</h2>${list.map(renderIssueHtml).join('')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Dataset Check Report - ${escapeHtml(result.datasetProfile.fileName)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  h1 { border-bottom: 2px solid #333; padding-bottom: .5rem; }
  table { border-collapse: collapse; margin: .5rem 0 1rem; }
  td { border: 1px solid #ccc; padding: .25rem .6rem; font-size: .9rem; }
  .issue { border: 1px solid #ddd; border-left-width: 6px; border-radius: 4px; padding: .8rem 1rem; margin: .8rem 0; }
  .issue.blocker { border-left-color: #c0392b; }
  .issue.warning { border-left-color: #e67e22; }
  .issue.info { border-left-color: #2980b9; }
  .badge { font-size: .75rem; padding: .15rem .5rem; border-radius: 3px; color: #fff; }
  .badge.blocker { background: #c0392b; }
  .badge.warning { background: #e67e22; }
  .badge.info { background: #2980b9; }
  .limitations { background: #fdf6e3; border: 1px solid #e0d6b8; padding: 1rem; border-radius: 4px; }
</style>
</head>
<body>
<h1>Dataset Check Report</h1>
<h2>Summary</h2>
<table><tbody>
<tr><td>Tool</td><td>Clinical Dataset Checker</td></tr>
<tr><td>App version</td><td>${escapeHtml(result.appVersion)}</td></tr>
<tr><td>Rule version</td><td>${escapeHtml(result.ruleVersion)}</td></tr>
<tr><td>Run at (UTC)</td><td>${formatTimestamp(result.runTimestamp)}</td></tr>
<tr><td>File</td><td>${escapeHtml(result.datasetProfile.fileName)}</td></tr>
<tr><td>Format</td><td>${escapeHtml(result.datasetProfile.format)}${
    result.datasetProfile.sheetName
      ? ` / sheet: ${escapeHtml(result.datasetProfile.sheetName)}`
      : ''
  }</td></tr>
<tr><td>Rows x Columns</td><td>${result.datasetProfile.totalRows} x ${result.datasetProfile.totalColumns}</td></tr>
<tr><td>Issues</td><td>${blockers.length} blocker / ${warnings.length} warning / ${infos.length} info</td></tr>
</tbody></table>

<h2>Import Configuration</h2>
<table><tbody>
<tr><td>Header row index (0-based)</td><td>${result.config.headerRowIndex}</td></tr>
<tr><td>ID column</td><td>${
    result.config.idColumnIndex !== undefined
      ? escapeHtml(result.datasetProfile.headers[result.config.idColumnIndex] ?? '')
      : 'Not specified'
  }</td></tr>
<tr><td>Longitudinal (repeated measures allowed)</td><td>${result.config.isLongitudinal}</td></tr>
<tr><td>Missing markers</td><td>${escapeHtml(result.config.missingMarkers.join(', ') || '(none)')}</td></tr>
<tr><td>Date columns</td><td>${escapeHtml(
    (result.config.dateColumnIndexes ?? [])
      .map((i) => result.datasetProfile.headers[i])
      .join(', ') || '(none)'
  )}</td></tr>
<tr><td>Analysis unit</td><td>${escapeHtml(result.config.analysisUnit ?? '(not specified)')}</td></tr>
</tbody></table>

${section('Blockers', blockers)}
${section('Warnings', warnings)}
${section('Information', infos)}
${result.issues.length === 0 ? '<p>No issues found.</p>' : ''}

<div class="limitations">
<strong>Limitations.</strong> This report does not certify that the data is suitable for any particular
statistical analysis. It provides no clinical interpretation and does not modify the source data.
Severity levels describe data-processing impact, not patient condition.
</div>
</body>
</html>`;
}

export function downloadFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
