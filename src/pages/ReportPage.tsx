import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAudit } from '../lib/api';
import type { GetAuditResponse, AuditReport } from '../../netlify/functions/shared/types';
import { ReportDisplay } from '../components/ReportDisplay';

type AuditStatus = 'loading' | 'queued' | 'running' | 'done' | 'error';

export function ReportPage() {
  const { auditId } = useParams<{ auditId: string }>();
  const [status, setStatus] = useState<AuditStatus>('loading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);

  const fetchAudit = useCallback(async () => {
    if (!auditId) {
      setError('No audit ID provided');
      setStatus('error');
      return;
    }

    try {
      const data: GetAuditResponse = await getAudit(auditId);
      
      setProgress(data.progress);
      
      if (data.status === 'done' && data.report) {
        setReport(data.report);
        setStatus('done');
      } else if (data.status === 'error') {
        setError(data.error || 'Audit failed');
        setStatus('error');
      } else {
        setStatus(data.status as AuditStatus);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit');
      setStatus('error');
    }
  }, [auditId]);

  useEffect(() => {
    fetchAudit();
    
    const interval = setInterval(() => {
      if (status === 'loading' || status === 'queued' || status === 'running') {
        fetchAudit();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchAudit, status]);

  // Loading/Progress UI
  if (status === 'loading' || status === 'queued' || status === 'running') {
    return (
      <div className="report-page">
        <header className="header">
          <Link to="/" className="logo">
            <div className="logo-icon"></div>
            <span className="logo-text">Glimpse</span>
          </Link>
        </header>

        <main className="progress-container">
          <div className="progress-card">
            <div className="progress-icon">
              <div className="spinner-large"></div>
            </div>
            
            <h1>Analyzing Your Website</h1>
            <p className="progress-status">
              {status === 'queued' && 'Queued - Starting soon...'}
              {status === 'running' && getProgressMessage(progress)}
              {status === 'loading' && 'Loading...'}
            </p>
            
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-percent">{progress}%</span>
            
            <p className="progress-note">
              This usually takes about 30 seconds. We're scanning multiple pages and running real performance tests.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Error UI
  if (status === 'error') {
    return (
      <div className="report-page">
        <header className="header">
          <Link to="/" className="logo">
            <div className="logo-icon"></div>
            <span className="logo-text">Glimpse</span>
          </Link>
        </header>

        <main className="error-container">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h1>Audit Failed</h1>
            <p className="error-message">{error}</p>
            <Link to="/" className="btn-primary">Try Again</Link>
          </div>
        </main>
      </div>
    );
  }

  // Report UI
  if (status === 'done' && report) {
    return <ReportDisplay report={report} />;
  }

  return null;
}

function getProgressMessage(progress: number): string {
  if (progress < 10) return 'Starting audit...';
  if (progress < 20) return 'Discovering pages...';
  if (progress < 70) return 'Running performance tests...';
  if (progress < 90) return 'Analyzing results...';
  return 'Generating report...';
}
