import React from 'react';
import { useTranslation } from 'react-i18next';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
  onLoadSample: () => void;
  sampleLoading: boolean;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onLoadSample, sampleLoading }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh-CN' : 'en');
  };

  return (
    <div className="home-container">
      <header className="app-header">
        <div className="header-left">
          <h1>{t('home.title')}</h1>
        </div>
        <div className="header-right">
          <button onClick={toggleLanguage} className="lang-btn" aria-label="Switch language">
            {i18n.language === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="hero">
          <h2>{t('home.subtitle')}</h2>
          <p>{t('home.description')}</p>
        </section>

        <section className="cta-buttons">
          <button className="btn btn-primary" onClick={() => onNavigate('import')}>
            {t('home.check_file')}
          </button>
          <button className="btn btn-secondary" onClick={onLoadSample} disabled={sampleLoading}>
            {sampleLoading ? t('common.loading') : t('home.try_sample')}
          </button>
        </section>

        <section className="features">
          <h3>{t('home.features.title')}</h3>
          <ul>
            <li>{t('home.features.local')}</li>
            <li>{t('home.features.privacy')}</li>
            <li>{t('home.features.formats')}</li>
            <li>{t('home.features.rules')}</li>
            <li>{t('home.features.export')}</li>
          </ul>
        </section>

        <section className="info-section">
          <div className="info-box">
            <h4>{t('common.app_description')}</h4>
            <p>{t('home.supported_formats')}</p>
            <p>{t('home.limitations')}</p>
          </div>
        </section>

        <footer className="app-footer">
          <button className="link-btn" onClick={() => onNavigate('about')}>
            {t('common.about')}
          </button>
          <button className="link-btn" onClick={() => onNavigate('privacy')}>
            {t('common.privacy')}
          </button>
        </footer>
      </main>
    </div>
  );
};
