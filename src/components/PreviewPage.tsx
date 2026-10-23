import React from 'react';
import { useTranslation } from 'react-i18next';
import { DatasetProfile } from '@/types/index';

interface PreviewPageProps {
  profile: DatasetProfile;
  onStartCheck: () => void;
  onBack: () => void;
}

export const PreviewPage: React.FC<PreviewPageProps> = ({ profile, onStartCheck, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="preview-page">
      <h2>{t('preview.title')}</h2>
      <div className="preview-info">
        <p>{t('preview.file_name', { name: profile.fileName })}</p>
        <p>
          {t('preview.total_rows', { rows: profile.totalRows })} ·{' '}
          {t('preview.total_columns', { cols: profile.totalColumns })}
        </p>
      </div>
      <p>{t('preview.preview_rows')}</p>
      <div className="preview-table" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              {profile.headers.map((h, i) => (
                <th scope="col" key={i}>
                  {h || `Column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.rows.slice(0, 20).map((row, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {profile.headers.map((_, j) => (
                  <td key={j}>{row[j] === null ? '' : String(row[j])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="button-group">
        <button onClick={onStartCheck} className="btn btn-primary">
          {t('preview.start_check')}
        </button>
        <button onClick={onBack} className="btn btn-secondary">
          {t('common.back')}
        </button>
      </div>
    </div>
  );
};
