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
        <div className="logo">
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
        </div>
      </header>

      <main className="hero">
        <div className="hero-badge">
          <span>✨ AI-Powered Website Audits</span>
        </div>
        
        <h1 className="hero-title">
          Get a <span className="gradient-text">complete picture</span><br />
          of your website's performance
        </h1>
        
        <p className="hero-subtitle">
          Glimpse analyzes your site's UX, conversion potential, accessibility, and SEO.
          Get actionable insights backed by real evidence.
        </p>

        <form className="audit-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your website URL (e.g., mystore.com)"
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
          <span>🔒 Secure analysis</span>
          <span>⚡ Results in ~30 seconds</span>
          <span>📊 Evidence-based insights</span>
        </div>
      </main>

      <section className="features">
        <h2>What We Analyze</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Performance</h3>
            <p>Core Web Vitals, load times, and mobile-first metrics from Google PageSpeed Insights.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Conversion Signals</h3>
            <p>Trust badges, CTAs, checkout flow, and persuasion elements that drive sales.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">♿</div>
            <h3>Accessibility</h3>
            <p>WCAG compliance checks ensuring your site works for everyone.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>SEO Health</h3>
            <p>Technical SEO factors that affect your search visibility.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Enter Your URL</h3>
            <p>Just paste your website address. We accept any valid domain.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>AI Scans Key Pages</h3>
            <p>We analyze your homepage, product pages, collections, and cart.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Your Report</h3>
            <p>Receive prioritized issues with evidence-backed fixes.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Glimpse. Built for conversion-focused teams.</p>
      </footer>
    </div>
  );
}

