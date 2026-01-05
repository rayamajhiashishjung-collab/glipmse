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
    
    // Poll every 2 seconds if not done/error
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
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="eye-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <ellipse cx="16" cy="16" rx="14" ry="9" stroke="url(#eye-gradient)" strokeWidth="2.5" fill="none" />
              <circle cx="16" cy="16" r="5" fill="url(#eye-gradient)" />
              <circle cx="18" cy="14" r="1.5" fill="white" />
            </svg>
            <span className="logo-text">Glimpse</span>
          </Link>
        </header>

        <main className="progress-container">
          <div className="progress-card">
            <div className="progress-icon">
              <svg className="spinner-large" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="80 40" />
              </svg>
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
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="eye-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <ellipse cx="16" cy="16" rx="14" ry="9" stroke="url(#eye-gradient)" strokeWidth="2.5" fill="none" />
              <circle cx="16" cy="16" r="5" fill="url(#eye-gradient)" />
              <circle cx="18" cy="14" r="1.5" fill="white" />
            </svg>
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

