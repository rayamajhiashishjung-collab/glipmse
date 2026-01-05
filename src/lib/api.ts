import type { StartAuditResponse, GetAuditResponse } from '../../netlify/functions/shared/types';

const API_BASE = '/.netlify/functions';

export async function startAudit(url: string): Promise<StartAuditResponse> {
  const res = await fetch(`${API_BASE}/start-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Failed to start audit');
  }
  
  return res.json();
}

export async function getAudit(auditId: string): Promise<GetAuditResponse> {
  const res = await fetch(`${API_BASE}/get-audit?auditId=${encodeURIComponent(auditId)}`);
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Failed to get audit');
  }
  
  return res.json();
}

