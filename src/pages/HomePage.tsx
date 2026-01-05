import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { startAudit } from '../lib/api';

export function HomePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a valid website URL');
      return;
    }

    setIsLoading(true);

    try {
      const { auditId } = await startAudit(trimmedUrl);
      navigate(`/report/${auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audit');
      setIsLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <a href="/" className="logo">
          <div className="logo-icon"></div>
          <span className="logo-text">Glimpse</span>
        </a>
        
        <nav className="nav-pills">
          <a href="#" className="active">Home</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <a href="#pricing" className="demo-btn">
          Get Pro Report
          <span className="arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </a>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-top-text">Free instant analysis — No signup required</div>
        
        <h1 className="hero-title">
          Find what's <span className="gradient-text">hurting</span> your website conversions
        </h1>
        
        <p className="hero-subtitle">
          AI-powered UX audit with clear, actionable fixes. Get your personalized report in under 60 seconds.
        </p>

        <form className={`search-form ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`} onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="Enter your website URL..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              'Analyze my website'
            )}
          </button>
        </form>
        
        {error && (
          <div className="error-message visible">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading-subtext visible">
            Analyzing your website, usually takes about 30 seconds...
          </div>
        )}

        <div className="cta-subtext" style={{ display: isLoading ? 'none' : 'flex' }}>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            100% Free
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            No credit card
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Instant results
          </span>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="social-proof-label">Trusted by 2,500+ businesses worldwide</div>
        <div className="social-proof-stats">
          <div className="stat">
            <div className="stat-number"><span>15,000+</span></div>
            <div className="stat-desc">Websites analyzed</div>
          </div>
          <div className="stat">
            <div className="stat-number"><span>23%</span></div>
            <div className="stat-desc">Avg. conversion lift</div>
          </div>
          <div className="stat">
            <div className="stat-number"><span>60 sec</span></div>
            <div className="stat-desc">Time to insights</div>
          </div>
        </div>
        <div className="company-logos">
          <span className="company-logo">Shopify</span>
          <span className="company-logo">Webflow</span>
          <span className="company-logo">Stripe</span>
          <span className="company-logo">Notion</span>
          <span className="company-logo">Figma</span>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-header">
          <h2>Everything you need to convert more visitors</h2>
          <p>Comprehensive analysis across all key conversion factors</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 12h6M12 9v6"/>
              </svg>
            </div>
            <h3>CTA Effectiveness</h3>
            <p>Analyze your call-to-action buttons for visibility, copy, and placement optimization.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3>Trust Signals</h3>
            <p>Identify missing social proof, guarantees, and credibility indicators that build confidence.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 8h10M7 12h6"/>
              </svg>
            </div>
            <h3>Form Optimization</h3>
            <p>Find friction points in your forms and get specific fixes to improve completion rates.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>First Impressions</h3>
            <p>Evaluate your above-the-fold content and value proposition clarity.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
              </svg>
            </div>
            <h3>Accessibility</h3>
            <p>Check WCAG compliance for contrast, alt text, keyboard navigation, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
            </div>
            <h3>Content Clarity</h3>
            <p>Improve your messaging to communicate benefits and make content scannable.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works-inner">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Enter your URL</h4>
              <p>Paste any website URL you want to analyze</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>AI analyzes your site</h4>
              <p>Our AI scans for 50+ conversion issues</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Get actionable fixes</h4>
              <p>Receive prioritized recommendations with how-to guides</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <div className="pricing-header">
            <h2>Simple, transparent pricing</h2>
            <p>Start free, upgrade when you need more insights</p>
          </div>
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="pricing-card-header">
                <div className="pricing-tier">Free</div>
                <div className="pricing-amount">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-value">0</span>
                </div>
                <div className="pricing-description">Perfect for quick audits</div>
              </div>
              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Basic UX & Conversion scores
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Top 5 critical issues
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  General fix recommendations
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  3 reports per month
                </li>
                <li className="disabled">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Full accessibility audit
                </li>
                <li className="disabled">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Export to PDF
                </li>
              </ul>
              <button className="pricing-btn secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Get started free
              </button>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-card-header">
                <div className="pricing-tier">Pro Report</div>
                <div className="pricing-amount">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-value">29</span>
                  <span className="pricing-period">/ report</span>
                </div>
                <div className="pricing-description">Complete analysis for serious growth</div>
              </div>
              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <strong>All 4 scores</strong> including Accessibility
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <strong>All issues</strong> across 7 categories
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <strong>Quick Wins</strong> prioritized by impact
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <strong>Step-by-step</strong> fix instructions
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <strong>Full accessibility</strong> WCAG audit
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <strong>Export to PDF</strong> for your team
                </li>
              </ul>
              <button className="pricing-btn primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Get Pro Report
              </button>
            </div>
          </div>

          <div className="pricing-trust">
            <div className="pricing-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              One-time payment
            </div>
            <div className="pricing-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Secure checkout
            </div>
            <div className="pricing-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Instant access
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bottom-cta">
        <div className="bottom-cta-box">
          <h2>Ready to boost your conversions?</h2>
          <p>Join thousands of businesses using Glimpse to optimize their websites.</p>
          <button className="bottom-cta-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Get your free report
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Glimpse. Built for conversion-focused teams.</p>
      </footer>
    </div>
  );
}
