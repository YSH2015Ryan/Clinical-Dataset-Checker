import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckResult, Issue, Severity } from '@/types/index';

interface ResultsPageProps {
  result: CheckResult;
  onExport: () => void;
  onHome: () => void;
}

const SEVERITY_ORDER: Severity[] = ['blocker', 'warning', 'info'];

const IssueCard: React.FC<{ issue: Issue }> = ({ issue }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`issue issue-${issue.severity}`}>
      <button
        className="issue-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={`severity-badge badge-${issue.severity}`}>
          {t(`common.${issue.severity}`)}
        </span>
        <span className="issue-title">{t(`check.${issue.ruleId.toLowerCase()}.title`)}</span>
        <span className="issue-count">
          {issue.affectedCount}
          {issue.denominator !== undefined ? ` / ${issue.denominator}` : ''}
        </span>
        <span className="expand-icon">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="issue-body">
          <p>{t(`check.${issue.ruleId.toLowerCase()}.description`)}</p>
          <p>
            <strong>{t('results.columns')}:</strong>{' '}
            {issue.columnNames.length > 0 ? issue.columnNames.join(', ') : 'N/A'}
          </p>
          <p>
            <strong>{t('results.affected_rows')}:</strong> {issue.affectedCount}
            {issue.denominator !== undefined ? ` / ${issue.denominator}` : ''}
          </p>
          <p>
            <strong>{t('results.sample_rows')}:</strong>{' '}
            {issue.rowIndexesSample.length > 0 ? issue.rowIndexesSample.join(', ') : 'N/A'}
          </p>
          <p>
            <strong>{t('results.action')}:</strong>{' '}
            {t(`check.${issue.ruleId.toLowerCase()}.action`)}
          </p>
          {Object.keys(issue.details).length > 0 && (
            <table className="details-table">
              <tbody>
                {Object.entries(issue.details).map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{v === null ? 'N/A' : String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export const ResultsPage: React.FC<ResultsPageProps> = ({ result, onExport, onHome }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const missingCells = result.issues
    .filter((i) => i.ruleId === 'MISSING_VALUES')
    .reduce((sum, i) => sum + i.affectedCount, 0);

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    issues: result.issues.filter((i) => i.severity === severity),
  }));

  const hasBlockers = grouped[0].issues.length > 0;

  return (
    <div className="results-page">
      <h2>{t('results.title')}</h2>

      <div className="summary">
        <h3>{t('results.data_summary.title')}</h3>
        <div className="summary-grid">
          <div>
            <span className="summary-value">{result.datasetProfile.totalRows}</span>
            <span className="summary-label">{t('results.data_summary.total_rows')}</span>
          </div>
          <div>
            <span className="summary-value">{result.datasetProfile.totalColumns}</span>
            <span className="summary-label">{t('results.data_summary.total_columns')}</span>
          </div>
          <div>
            <span className="summary-value">{missingCells}</span>
            <span className="summary-label">{t('results.data_summary.missing_cells')}</span>
          </div>
          <div>
            <span className="summary-value">{result.issues.length}</span>
            <span className="summary-label">{t('results.issues_label')}</span>
          </div>
        </div>
      </div>

      {hasBlockers && (
        <div className="blocker-banner" role="alert">
          {t('results.blocker_notice')}
        </div>
      )}

      <div className="filter-bar">
        <label htmlFor="severity-filter">{t('results.filter')}</label>
        <select
          id="severity-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Severity | 'all')}
        >
          <option value="all">{t('results.filter_all')}</option>
          <option value="blocker">{t('common.blocker')}</option>
          <option value="warning">{t('common.warning')}</option>
          <option value="info">{t('common.info')}</option>
        </select>
      </div>

      {result.issues.length === 0 && <p className="no-issues">{t('results.no_issues')}</p>}

      {grouped.map(({ severity, issues }) => {
        const visible = filter === 'all' || filter === severity;
        if (!visible || issues.length === 0) return null;
        return (
          <section key={severity} className="severity-group">
            <h3 className={`group-title group-${severity}`}>
              {t(`common.${severity}`)} ({issues.length})
            </h3>
            {issues.map((issue, i) => (
              <IssueCard key={`${issue.ruleId}-${i}`} issue={issue} />
            ))}
          </section>
        );
      })}

      <div className="button-group">
        <button onClick={onExport} className="btn btn-primary">
          {t('results.to_export')}
        </button>
        <button onClick={onHome} className="btn btn-secondary">
          {t('common.home')}
        </button>
      </div>
    </div>
  );
};
