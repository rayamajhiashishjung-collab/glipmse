// Shared types for Glimpse Audit

export interface AuditRecord {
  id: string;
  root_url: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditResultRecord {
  audit_id: string;
  report_json: AuditReport | null;
  pages_json: PageResult[] | null;
  created_at: string;
}

export interface PageResult {
  type: 'home' | 'collection' | 'product' | 'cart';
  url: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  vitals: {
    lcp?: number;
    cls?: number;
    tbt?: number;
    inp?: number;
    fcp?: number;
    si?: number;
  };
  evidence: {
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
    platform: 'Shopify' | 'Webflow' | 'WooCommerce' | 'Squarespace' | 'WordPress' | 'Unknown';
  };
  failingAudits: {
    id: string;
    title: string;
    description: string;
    score: number;
  }[];
  error?: string;
}

export interface AuditReport {
  site: {
    rootUrl: string;
    platform: string;
    industry: string;
  };
  pages: PageResult[];
  scores: {
    overall: number;
    ux: number;
    conversion: number;
    performance: number;
    seo: number;
    accessibility: number;
  };
  benchmarks: {
    industry: string;
    industryAvgOverall: number;
    industryAvgPerformance: number;
    note: string;
  };
  issueSummary: {
    critical: number;
    high: number;
    medium: number;
  };
  issues: {
    severity: 'critical' | 'high' | 'medium';
    title: string;
    pages: string[];
    evidence: string[];
    impact: string;
    fix: string[];
    proOnlyFix: boolean;
  }[];
  recommendations: {
    priority: number;
    title: string;
    effort: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
  }[];
}

export interface StartAuditRequest {
  url: string;
}

export interface StartAuditResponse {
  auditId: string;
}

export interface GetAuditResponse {
  auditId: string;
  status: AuditRecord['status'];
  progress: number;
  error: string | null;
  report?: AuditReport;
}

