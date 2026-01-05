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

  // Aggregate vitals from all pages (use home page primarily)
  const homePage = pages.find(p => p.type === 'home') || pages[0];
  const vitals = homePage?.vitals || {};
  const hasVitals = vitals.lcp || vitals.cls !== undefined || vitals.tbt || vitals.fcp;

  // Collect all failing audits from all pages
  const allFailingAudits = pages.flatMap(p => 
    (p.failingAudits || []).map(audit => ({ ...audit, pageType: p.type }))
  );
  // Dedupe by audit id and sort by score
  const uniqueAudits = Array.from(
    new Map(allFailingAudits.map(a => [a.id, a])).values()
  ).sort((a, b) => a.score - b.score).slice(0, 8);

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

        {/* Core Web Vitals - Lighthouse Style */}
        {hasVitals && (
          <section className="report-section">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 8, verticalAlign: 'middle'}}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Core Web Vitals
            </h2>
            <div className="vitals-grid">
              <VitalCard 
                label="LCP" 
                fullName="Largest Contentful Paint"
                value={vitals.lcp} 
                unit="s"
                divisor={1000}
                thresholds={[2500, 4000]}
              />
              <VitalCard 
                label="FCP" 
                fullName="First Contentful Paint"
                value={vitals.fcp} 
                unit="s"
                divisor={1000}
                thresholds={[1800, 3000]}
              />
              <VitalCard 
                label="TBT" 
                fullName="Total Blocking Time"
                value={vitals.tbt} 
                unit="ms"
                thresholds={[200, 600]}
              />
              <VitalCard 
                label="CLS" 
                fullName="Cumulative Layout Shift"
                value={vitals.cls} 
                decimals={3}
                thresholds={[0.1, 0.25]}
              />
              {vitals.si && (
                <VitalCard 
                  label="SI" 
                  fullName="Speed Index"
                  value={vitals.si} 
                  unit="s"
                  divisor={1000}
                  thresholds={[3400, 5800]}
                />
              )}
              {vitals.inp && (
                <VitalCard 
                  label="INP" 
                  fullName="Interaction to Next Paint"
                  value={vitals.inp} 
                  unit="ms"
                  thresholds={[200, 500]}
                />
              )}
            </div>
          </section>
        )}

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

        {/* Lighthouse Audits - Failing */}
        {uniqueAudits.length > 0 && (
          <section className="report-section">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 8, verticalAlign: 'middle'}}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Lighthouse Diagnostics
            </h2>
            <div className="audits-list">
              {uniqueAudits.map((audit, index) => (
                <div key={index} className="audit-item">
                  <div className={`audit-score ${audit.score < 0.5 ? 'fail' : 'warn'}`}>
                    {Math.round(audit.score * 100)}
                  </div>
                  <div className="audit-content">
                    <div className="audit-title">{audit.title}</div>
                    {audit.description && (
                      <div className="audit-desc">{audit.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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

interface VitalCardProps {
  label: string;
  fullName: string;
  value?: number;
  unit?: string;
  divisor?: number;
  decimals?: number;
  thresholds: [number, number]; // [good, poor] - below first is good, above second is poor
}

function VitalCard({ label, fullName, value, unit = '', divisor = 1, decimals = 1, thresholds }: VitalCardProps) {
  if (value === undefined) return null;
  
  const displayValue = divisor > 1 ? (value / divisor).toFixed(decimals) : 
                       decimals ? value.toFixed(decimals) : Math.round(value);
  
  const actualValue = divisor > 1 ? value / divisor : value;
  const thresholdGood = divisor > 1 ? thresholds[0] / divisor : thresholds[0];
  const thresholdPoor = divisor > 1 ? thresholds[1] / divisor : thresholds[1];
  
  let status: 'good' | 'needs-improvement' | 'poor';
  if (actualValue <= thresholdGood) {
    status = 'good';
  } else if (actualValue <= thresholdPoor) {
    status = 'needs-improvement';
  } else {
    status = 'poor';
  }
  
  return (
    <div className={`vital-card ${status}`}>
      <div className="vital-value">
        {displayValue}
        {unit && <span className="vital-unit">{unit}</span>}
      </div>
      <div className="vital-label">{label}</div>
      <div className="vital-fullname">{fullName}</div>
      <div className={`vital-status ${status}`}>
        {status === 'good' && '✓ Good'}
        {status === 'needs-improvement' && '⚠ Needs Work'}
        {status === 'poor' && '✗ Poor'}
      </div>
    </div>
  );
}

function PageCard({ page }: { page: PageResult }) {
  const scores = page.scores || { performance: 0, seo: 0, accessibility: 0, bestPractices: 0 };
  const vitals = page.vitals || {};
  const evidence = page.evidence || {};
  
  const getScoreClass = (s: number) => {
    if (s < 0) return 'unknown';
    if (s >= 90) return 'good';
    if (s >= 50) return 'needs-improvement';
    return 'poor';
  };
  
  return (
    <div className="page-card">
      <div className="page-card-type">{(page.type || 'page').toUpperCase()}</div>
      <div className="page-card-url">{page.url}</div>
      
      {/* Lighthouse-style score circles */}
      <div className="page-scores-row">
        <div className={`page-score-circle ${getScoreClass(scores.performance)}`}>
          <span>{scores.performance > 0 ? scores.performance : '—'}</span>
          <small>Perf</small>
        </div>
        <div className={`page-score-circle ${getScoreClass(scores.seo)}`}>
          <span>{scores.seo > 0 ? scores.seo : '—'}</span>
          <small>SEO</small>
        </div>
        <div className={`page-score-circle ${getScoreClass(scores.accessibility)}`}>
          <span>{scores.accessibility > 0 ? scores.accessibility : '—'}</span>
          <small>A11y</small>
        </div>
        <div className={`page-score-circle ${getScoreClass(scores.bestPractices)}`}>
          <span>{scores.bestPractices > 0 ? scores.bestPractices : '—'}</span>
          <small>BP</small>
        </div>
      </div>
      
      {/* Vitals */}
      {(vitals.lcp || vitals.cls !== undefined || vitals.tbt) && (
        <div className="page-vitals-row">
          {vitals.lcp && <span className="page-vital">LCP: {(vitals.lcp / 1000).toFixed(1)}s</span>}
          {vitals.cls !== undefined && <span className="page-vital">CLS: {vitals.cls.toFixed(3)}</span>}
          {vitals.tbt && <span className="page-vital">TBT: {vitals.tbt}ms</span>}
        </div>
      )}
      
      {/* Evidence Pills */}
      {Object.keys(evidence).length > 0 && (
        <div className="page-evidence">
          {evidence.platform && evidence.platform !== 'Unknown' && (
            <span className="evidence-pill platform">{evidence.platform}</span>
          )}
          {evidence.hasShipping && <span className="evidence-pill trust">Shipping ✓</span>}
          {evidence.hasReturns && <span className="evidence-pill trust">Returns ✓</span>}
          {evidence.hasGuarantee && <span className="evidence-pill trust">Guarantee ✓</span>}
        </div>
      )}
      
      {page.error && <div className="page-card-error">⚠️ {page.error}</div>}
    </div>
  );
}
