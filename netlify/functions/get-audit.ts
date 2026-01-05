import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getSupabaseClient } from './shared/supabase';
import type { GetAuditResponse, AuditRecord, AuditResultRecord } from './shared/types';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get auditId from query params
    const auditId = event.queryStringParameters?.auditId;
    
    if (!auditId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'auditId is required' }),
      };
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(auditId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid auditId format' }),
      };
    }

    const supabase = getSupabaseClient();
    
    // Fetch audit record
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();

    if (auditError || !audit) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Audit not found' }),
      };
    }

    const auditRecord = audit as AuditRecord;
    
    // Build response
    const response: GetAuditResponse = {
      auditId: auditRecord.id,
      status: auditRecord.status,
      progress: auditRecord.progress,
      error: auditRecord.error,
    };

    // If done, include report
    if (auditRecord.status === 'done') {
      const { data: result, error: resultError } = await supabase
        .from('audit_results')
        .select('report_json')
        .eq('audit_id', auditId)
        .single();

      if (!resultError && result) {
        const resultRecord = result as Pick<AuditResultRecord, 'report_json'>;
        if (resultRecord.report_json) {
          response.report = resultRecord.report_json;
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('get-audit error:', error);
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

