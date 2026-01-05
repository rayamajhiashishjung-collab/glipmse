import { Link } from 'react-router-dom';
import type { AuditReport } from '../../netlify/functions/shared/types';

interface ReportDisplayProps {
  report: AuditReport;
}

export function ReportDisplay({ report }: ReportDisplayProps) {
  const { site, scores, benchmarks, issueSummary, issues, recommendations, pages } = report;

  return (
    <div className="report-page">
      <header className="header">
        <Link to="/" className="logo">
          <div className="logo-icon"></div>
          <span className="logo-text">Glimpse</span>
        </Link>
        <Link to="/" className="btn-secondary">New Audit</Link>
      </header>

      <main className="report-container">
        {/* Site Info */}
        <section className="report-header">
          <h1>Audit Report</h1>
          <div className="site-info">
            <span className="site-url">{site.rootUrl}</span>
            <span className="site-meta">
              <span className="platform-badge">{site.platform}</span>
              <span className="industry-badge">{site.industry}</span>
            </span>
          </div>
        </section>

        {/* Score Cards */}
        <section className="scores-section">
          <div className="score-card-main">
            <div className="score-circle" data-score={getScoreClass(scores.overall)}>
              <span className="score-value">{scores.overall}</span>
            </div>
            <div className="score-label">Overall Score</div>
            <div className="benchmark-delta">
              {scores.overall >= benchmarks.industryAvgOverall ? (
                <span className="delta-positive">+{scores.overall - benchmarks.industryAvgOverall} vs industry avg</span>
              ) : (
                <span className="delta-negative">{scores.overall - benchmarks.industryAvgOverall} vs industry avg</span>
              )}
            </div>
          </div>

          <div className="score-cards-grid">
            <ScoreCard label="Performance" score={scores.performance} />
            <ScoreCard label="UX" score={scores.ux} />
            <ScoreCard label="Conversion" score={scores.conversion} />
            <ScoreCard label="SEO" score={scores.seo} />
            <ScoreCard label="Accessibility" score={scores.accessibility} />
          </div>
        </section>

        {/* Benchmark Note */}
        <div className="benchmark-note">
          <span>📊</span> {benchmarks.note}
        </div>

        {/* Issue Summary */}
        <section className="issue-summary">
          <h2>Issues Found</h2>
          <div className="issue-counts">
            <div className="issue-count critical">
              <span className="count">{issueSummary.critical}</span>
              <span className="label">Critical</span>
            </div>
            <div className="issue-count high">
              <span className="count">{issueSummary.high}</span>
              <span className="label">High</span>
            </div>
            <div className="issue-count medium">
              <span className="count">{issueSummary.medium}</span>
              <span className="label">Medium</span>
            </div>
          </div>
        </section>

        {/* Issues List */}
        <section className="issues-section">
          <h2>Detailed Issues</h2>
          <div className="issues-list">
            {issues.map((issue, index) => (
              <div key={index} className={`issue-card severity-${issue.severity}`}>
                <div className="issue-header">
                  <span className={`severity-badge ${issue.severity}`}>{issue.severity}</span>
                  <h3>{issue.title}</h3>
                </div>
                
                <div className="issue-pages">
                  {issue.pages.map((page, i) => (
                    <span key={i} className="page-tag">{page}</span>
                  ))}
                </div>

                <div className="issue-evidence">
                  <strong>Evidence:</strong>
                  <ul>
                    {issue.evidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>

                <div className="issue-impact">
                  <strong>Impact:</strong> {issue.impact}
                </div>

                <div className="issue-fix">
                  <strong>How to Fix:</strong>
                  <ul>
                    {issue.fix.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  {issue.proOnlyFix && (
                    <span className="pro-badge">🔧 Requires developer expertise</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="recommendations-section">
          <h2>Recommendations</h2>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="rec-priority">#{rec.priority}</div>
                <div className="rec-content">
                  <h3>{rec.title}</h3>
                  <div className="rec-meta">
                    <span className={`effort-badge effort-${rec.effort.toLowerCase()}`}>
                      Effort: {rec.effort}
                    </span>
                    <span className={`impact-badge impact-${rec.impact.toLowerCase()}`}>
                      Impact: {rec.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pages Analyzed */}
        <section className="pages-section">
          <h2>Pages Analyzed</h2>
          <div className="pages-grid">
            {pages.map((page, index) => (
              <div key={index} className="page-card">
                <div className="page-type">{page.type}</div>
                <div className="page-url">{page.url}</div>
                <div className="page-scores">
                  <span>Perf: {page.scores.performance}</span>
                  <span>SEO: {page.scores.seo}</span>
                  <span>A11y: {page.scores.accessibility}</span>
                </div>
                {page.vitals.lcp && (
                  <div className="page-vitals">
                    <span>LCP: {(page.vitals.lcp / 1000).toFixed(1)}s</span>
                    {page.vitals.cls !== undefined && <span>CLS: {page.vitals.cls.toFixed(3)}</span>}
                    {page.vitals.tbt && <span>TBT: {page.vitals.tbt}ms</span>}
                  </div>
                )}
                {page.error && <div className="page-error">⚠️ {page.error}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="report-cta">
          <h2>Ready to improve your site?</h2>
          <p>Bookmark this report or run another audit to track progress.</p>
          <Link to="/" className="btn-primary">Run Another Audit</Link>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 Glimpse. Report generated on {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="score-card">
      <div className="score-mini-circle" data-score={getScoreClass(score)}>
        {score}
      </div>
      <div className="score-label">{label}</div>
    </div>
  );
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}
