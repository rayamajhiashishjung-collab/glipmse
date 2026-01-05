import { Link } from 'react-router-dom';
import type { AuditReport, PageResult } from '../../netlify/functions/shared/types';

interface ReportDisplayProps {
  report: AuditReport;
}

export function ReportDisplay({ report }: ReportDisplayProps) {
  // Provide safe defaults for all fields
  const site = report.site || { rootUrl: '', platform: 'Unknown', industry: 'Other' };
  const scores = report.scores || { overall: 0, ux: 0, conversion: 0, performance: 0, seo: 0, accessibility: 0 };
  const benchmarks = report.benchmarks || { industry: 'eCommerce', industryAvgOverall: 65, industryAvgPerformance: 50, note: 'Benchmarks are heuristic estimates.' };
  const issueSummary = report.issueSummary || { critical: 0, high: 0, medium: 0 };
  const issues = report.issues || [];
  const recommendations = report.recommendations || [];
  const pages = report.pages || [];

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  };

  const delta = scores.overall - benchmarks.industryAvgOverall;

  return (
    <div className="report-page">
      <header className="report-header-bar">
        <Link to="/" className="logo">
          <div className="logo-icon"></div>
          <span className="logo-text">Glimpse</span>
        </Link>
        <div className="report-site-info">
          <span className="report-url">{site.rootUrl || 'Unknown URL'}</span>
          <span className="report-platform">{site.platform || 'Unknown'}</span>
          <span className="report-industry">{site.industry || 'Other'}</span>
        </div>
        <Link to="/" className="btn-dark">New Audit</Link>
      </header>

      <main className="report-main">
        {/* Main Score */}
        <div className="main-score-section">
          <div className="main-score-card">
            <div className={`main-score-circle ${getScoreClass(scores.overall)}`}>
              <span className="main-score-value">{scores.overall}</span>
            </div>
            <div className="main-score-label">Overall Score</div>
            <div className={`main-score-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
              {delta >= 0 ? '+' : ''}{delta} vs industry avg
            </div>
          </div>
        </div>

        {/* Score Cards Grid */}
        <div className="scores-row">
          <ScoreCard label="UX" sublabel="User Experience" score={scores.ux} />
          <ScoreCard label="Conversion" sublabel="Optimization" score={scores.conversion} />
          <ScoreCard label="Performance" sublabel="Speed" score={scores.performance} />
          <ScoreCard label="SEO" sublabel="Search" score={scores.seo} />
          <ScoreCard label="Accessibility" sublabel="WCAG" score={scores.accessibility} />
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="quick-stat-value critical">{issueSummary.critical}</span>
            <span className="quick-stat-label">Critical</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value high">{issueSummary.high}</span>
            <span className="quick-stat-label">High Priority</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value medium">{issueSummary.medium}</span>
            <span className="quick-stat-label">Medium</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value total">{issueSummary.critical + issueSummary.high + issueSummary.medium}</span>
            <span className="quick-stat-label">Total Issues</span>
          </div>
        </div>

        {/* Benchmark Note */}
        <div className="benchmark-note">
          📊 {benchmarks.note}
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <section className="report-section">
            <h2>Issues Found</h2>
            <div className="issues-list">
              {issues.map((issue, index) => (
                <div key={index} className={`issue-card ${issue.severity}`}>
                  <div className="issue-top">
                    <span className={`severity-tag ${issue.severity}`}>{issue.severity}</span>
                    <h3>{issue.title}</h3>
                  </div>
                  
                  {issue.pages && issue.pages.length > 0 && (
                    <div className="issue-pages-row">
                      {issue.pages.map((page, i) => (
                        <span key={i} className="page-pill">{page}</span>
                      ))}
                    </div>
                  )}

                  {issue.evidence && issue.evidence.length > 0 && (
                    <div className="issue-detail">
                      <strong>Evidence:</strong>
                      <ul>
                        {issue.evidence.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {issue.impact && (
                    <div className="issue-detail">
                      <strong>Impact:</strong> {issue.impact}
                    </div>
                  )}

                  {issue.fix && issue.fix.length > 0 && (
                    <div className="issue-detail">
                      <strong>How to Fix:</strong>
                      <ul>
                        {issue.fix.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="report-section">
            <h2>Recommendations</h2>
            <div className="recs-list">
              {recommendations.map((rec, index) => (
                <div key={index} className="rec-card">
                  <div className="rec-number">#{rec.priority}</div>
                  <div className="rec-body">
                    <h3>{rec.title}</h3>
                    <div className="rec-tags">
                      <span className={`rec-tag effort-${(rec.effort || 'medium').toLowerCase()}`}>Effort: {rec.effort || 'Medium'}</span>
                      <span className={`rec-tag impact-${(rec.impact || 'medium').toLowerCase()}`}>Impact: {rec.impact || 'Medium'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pages Analyzed */}
        {pages.length > 0 && (
          <section className="report-section">
            <h2>Pages Analyzed</h2>
            <div className="pages-row">
              {pages.map((page, index) => (
                <PageCard key={index} page={page} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="report-cta-box">
          <h2>Want to improve your scores?</h2>
          <p>Run another audit after making changes to track your progress.</p>
          <Link to="/" className="btn-primary">Run Another Audit</Link>
        </div>
      </main>

      <footer className="report-footer">
        © 2026 Glimpse. Report generated on {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}

function ScoreCard({ label, sublabel, score }: { label: string; sublabel: string; score: number }) {
  const getClass = (s: number) => s >= 90 ? 'good' : s >= 50 ? 'needs-improvement' : 'poor';
  
  return (
    <div className="score-card-small">
      <div className={`score-card-value ${getClass(score || 0)}`}>{score || 0}</div>
      <div className="score-card-label">{label}</div>
      <div className="score-card-sublabel">{sublabel}</div>
    </div>
  );
}

function PageCard({ page }: { page: PageResult }) {
  const scores = page.scores || { performance: 0, seo: 0, accessibility: 0, bestPractices: 0 };
  const vitals = page.vitals || {};
  
  return (
    <div className="page-card">
      <div className="page-card-type">{(page.type || 'page').toUpperCase()}</div>
      <div className="page-card-url">{page.url}</div>
      <div className="page-card-scores">
        <span>Perf: {scores.performance || 0}</span>
        <span>SEO: {scores.seo || 0}</span>
        <span>A11y: {scores.accessibility || 0}</span>
      </div>
      {vitals.lcp && (
        <div className="page-card-vitals">
          <span>LCP: {(vitals.lcp / 1000).toFixed(1)}s</span>
          {vitals.cls !== undefined && <span>CLS: {vitals.cls.toFixed(3)}</span>}
        </div>
      )}
      {page.error && <div className="page-card-error">⚠️ {page.error}</div>}
    </div>
  );
}
