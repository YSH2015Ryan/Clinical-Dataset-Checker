import React from 'react';
import { useTranslation } from 'react-i18next';

interface StaticPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<StaticPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  return (
    <div className="static-page">
      <h2>{t('about.title')}</h2>
      <p>{t('about.description')}</p>
      <p>{t('about.version', { version: '1.0.0' })}</p>
      <p>{t('about.license')}</p>
      <h3>{t('about.limitations.title')}</h3>
      <ul>
        <li>{t('about.limitations.not_clinical_tool')}</li>
        <li>{t('about.limitations.no_diagnosis')}</li>
        <li>{t('about.limitations.no_repair')}</li>
        <li>{t('about.limitations.no_compliance')}</li>
        <li>{t('about.limitations.data_checks')}</li>
      </ul>
      <div className="button-group">
        <button onClick={onBack} className="btn btn-secondary">
          {t('common.back')}
        </button>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC<StaticPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  return (
    <div className="static-page">
      <h2>{t('privacy.title')}</h2>
      <p>{t('privacy.overview')}</p>
      <ul>
        <li>
          <strong>{t('privacy.local_only')}:</strong> {t('privacy.local_only_desc')}
        </li>
        <li>
          <strong>{t('privacy.no_uploads')}:</strong> {t('privacy.no_uploads_desc')}
        </li>
        <li>
          <strong>{t('privacy.no_tracking')}:</strong> {t('privacy.no_tracking_desc')}
        </li>
        <li>
          <strong>{t('privacy.no_accounts')}:</strong> {t('privacy.no_accounts_desc')}
        </li>
      </ul>
      <p>{t('privacy.verify')}</p>
      <p>{t('privacy.exports')}</p>
      <div className="button-group">
        <button onClick={onBack} className="btn btn-secondary">
          {t('common.back')}
        </button>
      </div>
    </div>
  );
};
