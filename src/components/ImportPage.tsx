import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DatasetProfile, ImportConfig } from '@/types/index';

interface ImportPageProps {
  file: File | null;
  profile: DatasetProfile | null;
  config: ImportConfig;
  sheetNames: string[];
  detectedSeparator: string | null;
  parseWarnings: string[];
  loading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
  onConfigChange: (config: ImportConfig) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const SEPARATOR_OPTIONS = [
  { value: '', labelKey: 'import.separator_auto' },
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
];

export const ImportPage: React.FC<ImportPageProps> = ({
  file,
  profile,
  config,
  sheetNames,
  detectedSeparator,
  parseWarnings,
  loading,
  error,
  onFileSelect,
  onConfigChange,
  onConfirm,
  onBack,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<ImportConfig>) => {
    onConfigChange({ ...config, ...patch });
  };

  const toggleDateColumn = (idx: number, checked: boolean) => {
    const current = new Set(config.dateColumnIndexes ?? []);
    if (checked) {
      current.add(idx);
    } else {
      current.delete(idx);
    }
    update({ dateColumnIndexes: Array.from(current).sort((a, b) => a - b) });
  };

  const renderWarning = (w: string, i: number) => {
    const [code, count] = w.split(':');
    if (code === 'formula_cached_values') {
      return <li key={i}>{t('import.formula_warning', { count: Number(count) || 0 })}</li>;
    }
    if (code === 'parse_warnings') {
      return <li key={i}>{t('import.parse_warnings', { count: Number(count) || 0 })}</li>;
    }
    return <li key={i}>{w}</li>;
  };

  const columnOptions =
    profile?.headers.map((h, i) => ({ value: i, label: h || `Column ${i + 1}` })) ?? [];

  return (
    <div className="import-page">
      <h2>{t('import.title')}</h2>

      <div className="file-input-area">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          aria-label={t('import.title')}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
            e.target.value = '';
          }}
          disabled={loading}
        />
        <p>{t('import.drag_drop')}</p>
        <p className="limits-hint">
          {t('import.file_size_limit')} · {t('import.row_limit')} · {t('import.column_limit')}
        </p>
      </div>

      {loading && <div className="loading">{t('import.loading')}</div>}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {file && profile && !loading && (
        <div className="config-form">
          <p>
            <strong>{t('preview.file_name', { name: file.name })}</strong> —{' '}
            {t('preview.total_rows', { rows: profile.totalRows })},{' '}
            {t('preview.total_columns', { cols: profile.totalColumns })}
          </p>

          {parseWarnings.length > 0 && (
            <div className="warning-box" role="alert">
              <strong>{t('preview.parsing_warnings')}</strong>
              <ul>{parseWarnings.map(renderWarning)}</ul>
            </div>
          )}

          {profile.format === 'xlsx' && sheetNames.length > 1 && (
            <div className="form-field">
              <label htmlFor="sheet-select">{t('import.sheet')}</label>
              <select
                id="sheet-select"
                value={profile.sheetName ?? sheetNames[0]}
                onChange={(e) => update({ sheetName: e.target.value })}
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {profile.format === 'csv' && (
            <div className="form-field">
              <label htmlFor="separator-select">{t('import.separator')}</label>
              <select
                id="separator-select"
                value={config.separator ?? ''}
                onChange={(e) => update({ separator: e.target.value || undefined })}
              >
                {SEPARATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelKey
                      ? t(opt.labelKey, { separator: detectedSeparator ?? ',' })
                      : opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="header-row-input">{t('import.header_row')}</label>
            <input
              id="header-row-input"
              type="number"
              min={1}
              value={config.headerRowIndex + 1}
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value) || 1);
                update({ headerRowIndex: v - 1 });
              }}
            />
            <small>{t('import.header_row_help')}</small>
          </div>

          <div className="form-field">
            <label htmlFor="id-column-select">{t('import.id_column')}</label>
            <select
              id="id-column-select"
              value={config.idColumnIndex ?? ''}
              onChange={(e) =>
                update({
                  idColumnIndex: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            >
              <option value="">{t('import.none')}</option>
              {columnOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <small>{t('import.id_column_help')}</small>
          </div>

          <div className="form-field checkbox-field">
            <input
              id="longitudinal-checkbox"
              type="checkbox"
              checked={config.isLongitudinal}
              onChange={(e) => update({ isLongitudinal: e.target.checked })}
            />
            <label htmlFor="longitudinal-checkbox">{t('import.longitudinal')}</label>
          </div>

          <div className="form-field">
            <label htmlFor="missing-markers-input">{t('import.missing_markers')}</label>
            <input
              id="missing-markers-input"
              type="text"
              value={config.missingMarkers.join(', ')}
              onChange={(e) =>
                update({
                  missingMarkers: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0),
                })
              }
            />
            <small>{t('import.missing_markers_help')}</small>
          </div>

          <fieldset className="form-field">
            <legend>{t('import.date_columns')}</legend>
            <small>{t('import.date_columns_help')}</small>
            <div className="date-column-list">
              {columnOptions.map((opt) => (
                <label key={opt.value} className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={(config.dateColumnIndexes ?? []).includes(opt.value)}
                    onChange={(e) => toggleDateColumn(opt.value, e.target.checked)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="start-date-select">{t('import.start_date_column')}</label>
            <select
              id="start-date-select"
              value={config.startDateColumnIndex ?? ''}
              onChange={(e) =>
                update({
                  startDateColumnIndex: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            >
              <option value="">{t('import.none')}</option>
              {columnOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="end-date-select">{t('import.end_date_column')}</label>
            <select
              id="end-date-select"
              value={config.endDateColumnIndex ?? ''}
              onChange={(e) =>
                update({
                  endDateColumnIndex: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            >
              <option value="">{t('import.none')}</option>
              {columnOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="analysis-unit-input">{t('import.analysis_unit')}</label>
            <input
              id="analysis-unit-input"
              type="text"
              value={config.analysisUnit ?? ''}
              onChange={(e) => update({ analysisUnit: e.target.value || undefined })}
            />
            <small>{t('import.analysis_unit_help')}</small>
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={onConfirm}>
              {t('import.confirm_import')}
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              {t('common.back')}
            </button>
          </div>
        </div>
      )}

      {!file && !loading && (
        <div className="button-group">
          <button className="btn btn-secondary" onClick={onBack}>
            {t('common.back')}
          </button>
        </div>
      )}
    </div>
  );
};
