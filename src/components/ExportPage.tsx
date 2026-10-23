import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckResult } from '@/types/index';
import { buildHtmlReport, buildJsonReport, buildIssuesCsv, downloadFile } from '@lib/export';

interface ExportPageProps {
  result: CheckResult;
  onBack: () => void;
  onHome: () => void;
}

export const ExportPage: React.FC<ExportPageProps> = ({ result, onBack, onHome }) => {
  const { t } = useTranslation();
  const [acknowledged, setAcknowledged] = useState(false);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const hasBlockers = result.issues.some((i) => i.severity === 'blocker');
  const canDownload = !hasBlockers || acknowledged;

  const handleDownload = (format: 'html' | 'json' | 'csv') => {
    if (!canDownload) return;
    if (format === 'html') {
      downloadFile('dataset_check_report.html', buildHtmlReport(result), 'text/html');
    } else if (format === 'json') {
      downloadFile('dataset_check_report.json', buildJsonReport(result), 'application/json');
    } else {
      downloadFile('dataset_check_issues.csv', buildIssuesCsv(result), 'text/csv');
    }
    setDownloaded(format);
  };

  return (
    <div className="export-page">
      <h2>{t('export.title')}</h2>

      {hasBlockers && (
        <div className="blocker-banner" role="alert">
          <p>{t('export.blocker_notice')}</p>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            {t('export.blocker_ack')}
          </label>
        </div>
      )}

      <div className="export-options">
        <div className="export-option">
          <h3>{t('export.html')}</h3>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('html')}
            disabled={!canDownload}
          >
            {t('common.download')}
          </button>
        </div>
        <div className="export-option">
          <h3>{t('export.json')}</h3>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('json')}
            disabled={!canDownload}
          >
            {t('common.download')}
          </button>
        </div>
        <div className="export-option">
          <h3>{t('export.csv')}</h3>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('csv')}
            disabled={!canDownload}
          >
            {t('common.download')}
          </button>
        </div>
      </div>

      {downloaded && <p className="success-message">{t('export.success')}</p>}

      <div className="button-group">
        <button onClick={onBack} className="btn btn-secondary">
          {t('common.back')}
        </button>
        <button onClick={onHome} className="btn btn-secondary">
          {t('common.home')}
        </button>
      </div>
    </div>
  );
};
