import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getSupabaseClient } from './shared/supabase';
import type { PageResult, AuditReport } from './shared/types';

// ============================================================================
// UTILITIES
// ============================================================================

async function updateProgress(supabase: ReturnType<typeof getSupabaseClient>, auditId: string, progress: number, status?: string) {
  const updates: Record<string, unknown> = { progress };
  if (status) updates.status = status;
  
  await supabase.from('audits').update(updates).eq('id', auditId);
}

async function setError(supabase: ReturnType<typeof getSupabaseClient>, auditId: string, error: string) {
  await supabase.from('audits').update({ status: 'error', error }).eq('id', auditId);
}

// ============================================================================
// PAGE DISCOVERY
// ============================================================================

interface DiscoveredPages {
  home: string;
  collection?: string;
  product?: string;
  cart?: string;
}

async function discoverPages(rootUrl: string): Promise<DiscoveredPages> {
  const pages: DiscoveredPages = { home: rootUrl };
  const baseUrl = new URL(rootUrl);
  
  // Common paths to try
  const collectionPaths = [
    '/collections/all',
    '/collections',
    '/shop',
    '/products',
    '/product-category',
    '/store',
    '/catalog',
  ];
  
  const cartPaths = ['/cart', '/checkout', '/bag', '/basket'];
  
  // Try to fetch sitemap first for better discovery
  const sitemapUrls = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];
  let sitemapLinks: string[] = [];
  
  for (const sitemapPath of sitemapUrls) {
    try {
      const res = await fetch(`${baseUrl.origin}${sitemapPath}`, {
        headers: { 'User-Agent': 'GlimpseBot/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const text = await res.text();
        // Extract URLs from sitemap
        const urlMatches = text.match(/<loc>([^<]+)<\/loc>/gi) || [];
        sitemapLinks = urlMatches.map(m => m.replace(/<\/?loc>/gi, ''));
        break;
      }
    } catch {
      // Continue to next sitemap path
    }
  }
  
  // Find collection page
  for (const path of collectionPaths) {
    try {
      const url = `${baseUrl.origin}${path}`;
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'GlimpseBot/1.0' },
        signal: AbortSignal.timeout(3000),
        redirect: 'follow',
      });
      if (res.ok) {
        pages.collection = url;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  // If sitemap has collection links, prefer those
  const sitemapCollection = sitemapLinks.find(l => 
    /\/collections\/|\/product-category\/|\/shop\//i.test(l) && 
    !/\/products\/|\/product\//i.test(l)
  );
  if (sitemapCollection) pages.collection = sitemapCollection;
  
  // Find product page from sitemap or by crawling homepage
  const sitemapProduct = sitemapLinks.find(l => /\/products\/|\/product\//i.test(l));
  if (sitemapProduct) {
    pages.product = sitemapProduct;
  } else {
    // Try to find a product link from homepage
    try {
      const homeRes = await fetch(rootUrl, {
        headers: { 'User-Agent': 'GlimpseBot/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (homeRes.ok) {
        const html = await homeRes.text();
        const productMatch = html.match(/href=["']([^"']*\/products?\/[^"'#?]+)/i);
        if (productMatch) {
          const productPath = productMatch[1];
          pages.product = productPath.startsWith('http') 
            ? productPath 
            : `${baseUrl.origin}${productPath.startsWith('/') ? '' : '/'}${productPath}`;
        }
      }
    } catch {
      // Continue without product page
    }
  }
  
  // Find cart page
  for (const path of cartPaths) {
    try {
      const url = `${baseUrl.origin}${path}`;
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'GlimpseBot/1.0' },
        signal: AbortSignal.timeout(3000),
        redirect: 'follow',
      });
      if (res.ok && res.status !== 404) {
        pages.cart = url;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  return pages;
}

// ============================================================================
// PAGESPEED INSIGHTS
// ============================================================================

interface PSIResult {
  scores: PageResult['scores'];
  vitals: PageResult['vitals'];
  failingAudits: PageResult['failingAudits'];
}

async function runPageSpeedInsights(url: string, apiKey: string): Promise<PSIResult> {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', url);
  apiUrl.searchParams.set('key', apiKey);
  apiUrl.searchParams.set('strategy', 'mobile');
  apiUrl.searchParams.set('category', 'performance');
  apiUrl.searchParams.set('category', 'seo');
  apiUrl.searchParams.set('category', 'accessibility');
  apiUrl.searchParams.set('category', 'best-practices');
  
  const res = await fetch(apiUrl.toString(), {
    signal: AbortSignal.timeout(60000), // PSI can be slow
  });
  
  if (!res.ok) {
    throw new Error(`PSI API error: ${res.status}`);
  }
  
  const data = await res.json();
  const categories = data.lighthouseResult?.categories || {};
  const audits = data.lighthouseResult?.audits || {};
  
  // Extract scores (0-100)
  const scores: PSIResult['scores'] = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
  };
  
  // Extract Core Web Vitals
  const vitals: PSIResult['vitals'] = {};
  
  if (audits['largest-contentful-paint']?.numericValue) {
    vitals.lcp = Math.round(audits['largest-contentful-paint'].numericValue);
  }
  if (audits['cumulative-layout-shift']?.numericValue !== undefined) {
    vitals.cls = audits['cumulative-layout-shift'].numericValue;
  }
  if (audits['total-blocking-time']?.numericValue) {
    vitals.tbt = Math.round(audits['total-blocking-time'].numericValue);
  }
  if (audits['first-contentful-paint']?.numericValue) {
    vitals.fcp = Math.round(audits['first-contentful-paint'].numericValue);
  }
  if (audits['speed-index']?.numericValue) {
    vitals.si = Math.round(audits['speed-index'].numericValue);
  }
  // INP is in field data if available
  const fieldMetrics = data.loadingExperience?.metrics || {};
  if (fieldMetrics.INTERACTION_TO_NEXT_PAINT?.percentile) {
    vitals.inp = fieldMetrics.INTERACTION_TO_NEXT_PAINT.percentile;
  }
  
  // Find failing audits (score < 0.5)
  const failingAudits: PSIResult['failingAudits'] = [];
  const auditIds = Object.keys(audits);
  
  for (const auditId of auditIds) {
    const audit = audits[auditId];
    if (
      audit.score !== null && 
      audit.score < 0.5 && 
      audit.title &&
      !['screenshot-thumbnails', 'final-screenshot', 'script-treemap-data'].includes(auditId)
    ) {
      failingAudits.push({
        id: auditId,
        title: audit.title,
        description: audit.description?.substring(0, 200) || '',
        score: audit.score,
      });
    }
  }
  
  // Sort by score ascending (worst first) and take top 10
  failingAudits.sort((a, b) => a.score - b.score);
  
  return {
    scores,
    vitals,
    failingAudits: failingAudits.slice(0, 10),
  };
}

// ============================================================================
// HTML ANALYSIS
// ============================================================================

interface HTMLEvidence {
  h1Count: number;
  buttonCount: number;
  inputCount: number;
  linkCount: number;
  imageCount: number;
  hasShipping: boolean;
  hasReturns: boolean;
  hasGuarantee: boolean;
  hasTrustBadges: boolean;
  hasReviews: boolean;
  platform: PageResult['evidence']['platform'];
}

async function analyzeHTML(url: string): Promise<HTMLEvidence> {
  const res = await fetch(url, {
    headers: { 
      'User-Agent': 'GlimpseBot/1.0',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch HTML: ${res.status}`);
  }
  
  const html = await res.text();
  const lowerHtml = html.toLowerCase();
  
  // Count elements using regex (lightweight, no heavy parsing)
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const buttonCount = (html.match(/<button[\s>]/gi) || []).length + 
                     (html.match(/type=["']submit["']/gi) || []).length;
  const inputCount = (html.match(/<input[\s>]/gi) || []).length;
  const linkCount = (html.match(/<a[\s>]/gi) || []).length;
  const imageCount = (html.match(/<img[\s>]/gi) || []).length;
  
  // Trust signals
  const hasShipping = /free shipping|fast shipping|shipping info|delivery/i.test(html);
  const hasReturns = /free returns|return policy|easy returns|30.day return|money.back/i.test(html);
  const hasGuarantee = /guarantee|warranty|satisfaction|secure checkout/i.test(html);
  const hasTrustBadges = /trustpilot|bbb|secure|verified|ssl|norton|mcafee/i.test(html);
  const hasReviews = /reviews?|rating|stars?|testimonial/i.test(html) && 
                    (html.match(/\d+\s*reviews?/i) !== null || /★|⭐|star/i.test(html));
  
  // Platform detection
  let platform: HTMLEvidence['platform'] = 'Unknown';
  
  if (lowerHtml.includes('shopify') || lowerHtml.includes('cdn.shopify.com')) {
    platform = 'Shopify';
  } else if (lowerHtml.includes('webflow') || lowerHtml.includes('wf-') || 
             html.includes('data-wf-')) {
    platform = 'Webflow';
  } else if (lowerHtml.includes('woocommerce') || lowerHtml.includes('wc-') ||
             lowerHtml.includes('wp-content')) {
    if (lowerHtml.includes('woocommerce') || lowerHtml.includes('wc-block')) {
      platform = 'WooCommerce';
    } else {
      platform = 'WordPress';
    }
  } else if (lowerHtml.includes('squarespace') || lowerHtml.includes('static1.squarespace')) {
    platform = 'Squarespace';
  }
  
  return {
    h1Count,
    buttonCount,
    inputCount,
    linkCount,
    imageCount,
    hasShipping,
    hasReturns,
    hasGuarantee,
    hasTrustBadges,
    hasReviews,
    platform,
  };
}

// ============================================================================
// LLM SYNTHESIS
// ============================================================================

const REPORT_SCHEMA = `{
  "site": { "rootUrl": "string", "platform": "string", "industry": "string" },
  "pages": [...], // Already provided, copy as-is
  "scores": { "overall": 0-100, "ux": 0-100, "conversion": 0-100, "performance": 0-100, "seo": 0-100, "accessibility": 0-100 },
  "benchmarks": { "industry": "string", "industryAvgOverall": 0-100, "industryAvgPerformance": 0-100, "note": "string" },
  "issueSummary": { "critical": n, "high": n, "medium": n },
  "issues": [{ "severity": "critical|high|medium", "title": "string", "pages": ["string"], "evidence": ["string"], "impact": "string", "fix": ["string"], "proOnlyFix": boolean }],
  "recommendations": [{ "priority": 1-10, "title": "string", "effort": "Low|Medium|High", "impact": "Low|Medium|High" }]
}`;

async function synthesizeReport(
  rootUrl: string,
  pages: PageResult[],
  apiKey: string
): Promise<AuditReport> {
  const prompt = `You are a UX and conversion optimization expert. Analyze the following website audit data and produce a structured JSON report.

WEBSITE: ${rootUrl}

PAGE DATA:
${JSON.stringify(pages, null, 2)}

REQUIREMENTS:
1. Every issue MUST have evidence from the page data. No generic claims without proof.
2. Limit to top 10 most impactful issues, ordered by severity then impact.
3. Calculate overall scores based on the page scores and evidence.
4. Provide actionable, specific recommendations.
5. Set proOnlyFix=true for complex fixes requiring developer expertise.
6. Benchmarks are heuristic estimates - include a disclaimer note.

SCORING GUIDANCE:
- UX score: Based on accessibility, best practices, page structure (h1 count, proper elements)
- Conversion score: Based on trust signals, CTAs, forms, checkout optimization evidence
- Overall: Weighted average considering all factors

OUTPUT SCHEMA:
${REPORT_SCHEMA}

Respond with ONLY valid JSON, no markdown code fences or explanation.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(60000),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
  }
  
  const data = await res.json();
  let content = data.choices?.[0]?.message?.content || '';
  
  // Strip code fences if present
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  
  try {
    const report = JSON.parse(content) as AuditReport;
    
    // Ensure pages are included
    report.pages = pages;
    report.site.rootUrl = rootUrl;
    
    return report;
  } catch (parseError) {
    console.error('Failed to parse LLM response:', content);
    throw new Error('Failed to parse LLM response as JSON');
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const supabase = getSupabaseClient();
  let auditId: string | undefined;

  try {
    const body = JSON.parse(event.body || '{}');
    auditId = body.auditId;

    if (!auditId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'auditId required' }) };
    }

    // Get audit record
    const { data: audit, error: fetchError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (fetchError || !audit) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Audit not found' }) };
    }

    const rootUrl = audit.root_url as string;

    // Check env vars
    const psiApiKey = process.env.PSI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!psiApiKey || !openaiApiKey) {
      await setError(supabase, auditId, 'Server configuration error: missing API keys');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing API keys' }) };
    }

    // Update status to running
    await updateProgress(supabase, auditId, 5, 'running');

    // Step 1: Discover pages (10%)
    console.log('Discovering pages for:', rootUrl);
    const discovered = await discoverPages(rootUrl);
    await updateProgress(supabase, auditId, 10);

    // Build page list
    const pageConfigs: { type: PageResult['type']; url: string }[] = [
      { type: 'home', url: discovered.home },
    ];
    if (discovered.collection) pageConfigs.push({ type: 'collection', url: discovered.collection });
    if (discovered.product) pageConfigs.push({ type: 'product', url: discovered.product });
    if (discovered.cart) pageConfigs.push({ type: 'cart', url: discovered.cart });

    // Limit to 4 pages max
    const pagesToAudit = pageConfigs.slice(0, 4);
    const progressPerPage = 60 / pagesToAudit.length; // 10-70% for page audits

    // Step 2: Audit each page
    const pageResults: PageResult[] = [];
    let currentProgress = 10;

    for (const pageConfig of pagesToAudit) {
      console.log(`Auditing page: ${pageConfig.type} - ${pageConfig.url}`);
      
      const pageResult: PageResult = {
        type: pageConfig.type,
        url: pageConfig.url,
        scores: { performance: 0, seo: 0, accessibility: 0, bestPractices: 0 },
        vitals: {},
        evidence: {
          h1Count: 0,
          buttonCount: 0,
          inputCount: 0,
          linkCount: 0,
          imageCount: 0,
          hasShipping: false,
          hasReturns: false,
          hasGuarantee: false,
          hasTrustBadges: false,
          hasReviews: false,
          platform: 'Unknown',
        },
        failingAudits: [],
      };

      // Run PSI
      try {
        const psiResult = await runPageSpeedInsights(pageConfig.url, psiApiKey);
        pageResult.scores = psiResult.scores;
        pageResult.vitals = psiResult.vitals;
        pageResult.failingAudits = psiResult.failingAudits;
      } catch (psiError) {
        console.error(`PSI error for ${pageConfig.url}:`, psiError);
        pageResult.error = `PSI failed: ${psiError instanceof Error ? psiError.message : 'Unknown error'}`;
      }

      // Analyze HTML
      try {
        const htmlEvidence = await analyzeHTML(pageConfig.url);
        pageResult.evidence = htmlEvidence;
      } catch (htmlError) {
        console.error(`HTML analysis error for ${pageConfig.url}:`, htmlError);
        // Keep default evidence values
      }

      pageResults.push(pageResult);
      currentProgress += progressPerPage;
      await updateProgress(supabase, auditId, Math.round(currentProgress));
    }

    // Step 3: Synthesize report with LLM (70-95%)
    await updateProgress(supabase, auditId, 75);
    console.log('Synthesizing report with LLM...');

    let report: AuditReport;
    try {
      report = await synthesizeReport(rootUrl, pageResults, openaiApiKey);
    } catch (llmError) {
      console.error('LLM synthesis failed:', llmError);
      
      // Store partial results
      await supabase.from('audit_results').upsert({
        audit_id: auditId,
        pages_json: pageResults,
        report_json: null,
      });
      
      await setError(supabase, auditId, `Report synthesis failed: ${llmError instanceof Error ? llmError.message : 'Unknown error'}`);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'LLM synthesis failed' }) };
    }

    await updateProgress(supabase, auditId, 95);

    // Step 4: Store results
    const { error: resultError } = await supabase.from('audit_results').upsert({
      audit_id: auditId,
      report_json: report,
      pages_json: pageResults,
    });

    if (resultError) {
      console.error('Failed to store results:', resultError);
      await setError(supabase, auditId, 'Failed to store audit results');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to store results' }) };
    }

    // Mark as done
    await supabase.from('audits').update({ status: 'done', progress: 100 }).eq('id', auditId);

    console.log('Audit completed successfully:', auditId);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error('run-audit error:', error);
    
    if (auditId) {
      await setError(supabase, auditId, error instanceof Error ? error.message : 'Unknown error');
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
    };
  }
};

export { handler };

