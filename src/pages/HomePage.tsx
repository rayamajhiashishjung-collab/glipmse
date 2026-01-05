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
      setError('Please enter a website URL');
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
      <header className="header">
        <a href="/" className="logo">
          <div className="logo-icon"></div>
          <span className="logo-text">Glimpse</span>
        </a>
      </header>

      <main className="hero">
        <div className="hero-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          AI-Powered Website Audits
        </div>
        
        <h1 className="hero-title">
          Find what's <span className="gradient-text">hurting</span><br />
          your conversions
        </h1>
        
        <p className="hero-subtitle">
          Get a complete UX, performance, and conversion audit of your website in seconds. Powered by real data and AI insights.
        </p>

        <form className="audit-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your website URL..."
              disabled={isLoading}
              className={error ? 'input-error' : ''}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze Website'
              )}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </form>

        <div className="trust-badges">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="16" height="16">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            No signup required
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="16" height="16">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Results in ~30 seconds
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="16" height="16">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Evidence-based insights
          </span>
        </div>
      </main>

      <section className="features">
        <h2>What We Analyze</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" width="26" height="26">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <h3>Performance</h3>
            <p>Core Web Vitals, load times, and mobile-first metrics from Google PageSpeed.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="26" height="26">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h3>User Experience</h3>
            <p>Accessibility, navigation patterns, and usability signals that affect engagement.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" width="26" height="26">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3>Conversion Signals</h3>
            <p>Trust badges, CTAs, checkout optimization, and persuasion elements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" width="26" height="26">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h3>SEO Health</h3>
            <p>Technical SEO factors, meta tags, and crawlability that affect search rankings.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Enter Your URL</h3>
            <p>Paste any website URL. We accept domains with or without https.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>AI Scans Pages</h3>
            <p>We analyze your homepage, product pages, collections, and cart.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Your Report</h3>
            <p>Receive prioritized issues with evidence-backed recommendations.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Glimpse. Built for conversion-focused teams.</p>
      </footer>
    </div>
  );
}
