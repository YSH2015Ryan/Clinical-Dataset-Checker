import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';
import {
  DatasetProfile,
  CheckResult,
  ImportConfig,
  ParseResult,
  DEFAULT_IMPORT_CONFIG,
} from '@/types/index';
import { parseFile } from '@lib/parsers';
import { runAllChecks, RULE_VERSION } from '@lib/rules';
import { Home } from '@components/Home';
import { ImportPage } from '@components/ImportPage';
import { PreviewPage } from '@components/PreviewPage';
import { ResultsPage } from '@components/ResultsPage';
import { ExportPage } from '@components/ExportPage';
import { AboutPage, PrivacyPage } from '@components/StaticPages';
import './App.css';

const APP_VERSION = '1.0.0';
const SAMPLE_FILE_URL = `${import.meta.env.BASE_URL}sample-clinical-data.csv`;

type Page = 'home' | 'import' | 'preview' | 'results' | 'export' | 'about' | 'privacy';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [file, setFile] = useState<File | null>(null);
  const [datasetProfile, setDatasetProfile] = useState<DatasetProfile | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [importConfig, setImportConfig] = useState<ImportConfig>({ ...DEFAULT_IMPORT_CONFIG });
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [detectedSeparator, setDetectedSeparator] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runParse = useCallback(
    async (f: File, config: ImportConfig) => {
      setLoading(true);
      setError(null);
      try {
        const result: ParseResult = await parseFile(f, config);
        if (result.success && result.data) {
          setDatasetProfile(result.data);
          setSheetNames(result.sheetNames ?? []);
          setDetectedSeparator(result.detectedSeparator ?? null);
          setParseWarnings(result.warnings);
        } else {
          setDatasetProfile(null);
          setSheetNames([]);
          setDetectedSeparator(null);
          setParseWarnings([]);
          setError(t(`errors.${result.errorCode?.toLowerCase() || 'parse_error'}`));
        }
      } catch {
        setDatasetProfile(null);
        setError(t('errors.unknown_error'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const handleFileSelect = useCallback(
    (f: File) => {
      setFile(f);
      setImportConfig({ ...DEFAULT_IMPORT_CONFIG });
      void runParse(f, { ...DEFAULT_IMPORT_CONFIG });
    },
    [runParse]
  );

  const handleConfigChange = useCallback(
    (config: ImportConfig) => {
      setImportConfig(config);
      if (file) {
        void runParse(file, config);
      }
    },
    [file, runParse]
  );

  const handleLoadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SAMPLE_FILE_URL);
      if (!response.ok) throw new Error('sample fetch failed');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'sample-clinical-data.csv', { type: 'text/csv' });
      setFile(sampleFile);
      setImportConfig({ ...DEFAULT_IMPORT_CONFIG });
      await runParse(sampleFile, { ...DEFAULT_IMPORT_CONFIG });
      setCurrentPage('import');
    } catch {
      setError(t('errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  }, [runParse, t]);

  const handleStartCheck = useCallback(() => {
    if (!datasetProfile) return;

    const issues = runAllChecks(datasetProfile);
    const result: CheckResult = {
      datasetProfile,
      issues,
      ruleVersion: RULE_VERSION,
      appVersion: APP_VERSION,
      runTimestamp: Date.now(),
      config: importConfig,
    };
    setCheckResult(result);
    setCurrentPage('results');
  }, [datasetProfile, importConfig]);

  const handleNavigate = useCallback((page: string) => {
    if (page === 'home') {
      setFile(null);
      setDatasetProfile(null);
      setCheckResult(null);
      setError(null);
      setSheetNames([]);
      setDetectedSeparator(null);
      setParseWarnings([]);
      setImportConfig({ ...DEFAULT_IMPORT_CONFIG });
      setCurrentPage('home');
      return;
    }
    setCurrentPage(page as Page);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            onNavigate={handleNavigate}
            onLoadSample={handleLoadSample}
            sampleLoading={loading}
          />
        );
      case 'import':
        return (
          <ImportPage
            file={file}
            profile={datasetProfile}
            config={importConfig}
            sheetNames={sheetNames}
            detectedSeparator={detectedSeparator}
            parseWarnings={parseWarnings}
            loading={loading}
            error={error}
            onFileSelect={handleFileSelect}
            onConfigChange={handleConfigChange}
            onConfirm={() => setCurrentPage('preview')}
            onBack={() => handleNavigate('home')}
          />
        );
      case 'preview':
        return datasetProfile ? (
          <PreviewPage
            profile={datasetProfile}
            onStartCheck={handleStartCheck}
            onBack={() => setCurrentPage('import')}
          />
        ) : (
          <Home
            onNavigate={handleNavigate}
            onLoadSample={handleLoadSample}
            sampleLoading={loading}
          />
        );
      case 'results':
        return checkResult ? (
          <ResultsPage
            result={checkResult}
            onExport={() => setCurrentPage('export')}
            onHome={() => handleNavigate('home')}
          />
        ) : (
          <Home
            onNavigate={handleNavigate}
            onLoadSample={handleLoadSample}
            sampleLoading={loading}
          />
        );
      case 'export':
        return checkResult ? (
          <ExportPage
            result={checkResult}
            onBack={() => setCurrentPage('results')}
            onHome={() => handleNavigate('home')}
          />
        ) : (
          <Home
            onNavigate={handleNavigate}
            onLoadSample={handleLoadSample}
            sampleLoading={loading}
          />
        );
      case 'about':
        return <AboutPage onBack={() => handleNavigate('home')} />;
      case 'privacy':
        return <PrivacyPage onBack={() => handleNavigate('home')} />;
      default:
        return (
          <Home
            onNavigate={handleNavigate}
            onLoadSample={handleLoadSample}
            sampleLoading={loading}
          />
        );
    }
  };

  return <div className="app">{renderPage()}</div>;
};
