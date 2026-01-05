import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from './shared/supabase';
import type { StartAuditRequest, StartAuditResponse } from './shared/types';

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');
  
  // Add https:// if no protocol
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }
  
  // Validate URL format
  try {
    new URL(normalized);
  } catch {
    throw new Error('Invalid URL format');
  }
  
  return normalized;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body: StartAuditRequest = JSON.parse(event.body || '{}');
    
    if (!body.url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Normalize URL
    const rootUrl = normalizeUrl(body.url);
    
    // Generate audit ID
    const auditId = uuidv4();
    
    // Create audit record in Supabase
    const supabase = getSupabaseClient();
    
    const { error: insertError } = await supabase
      .from('audits')
      .insert({
        id: auditId,
        root_url: rootUrl,
        status: 'queued',
        progress: 0,
      });

    if (insertError) {
      console.error('Failed to create audit:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create audit' }),
      };
    }

    // Fire-and-forget: trigger run-audit function
    // Use Netlify's internal function URL or SITE_URL
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
    const runAuditUrl = `${siteUrl}/.netlify/functions/run-audit`;
    
    // Don't await - fire and forget
    fetch(runAuditUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId }),
    }).catch((err) => {
      console.error('Failed to trigger run-audit:', err);
    });

    const response: StartAuditResponse = { auditId };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('start-audit error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
    };
  }
};

export { handler };

