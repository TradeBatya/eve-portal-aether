import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, characterId, method = 'GET', body, userAgent } = await req.json();

    if (!endpoint) {
      throw new Error('Endpoint is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get token for authenticated requests
    let accessToken = null;
    if (characterId) {
      accessToken = await getValidToken(supabase, characterId);
    }

    // Execute ESI request
    const startTime = Date.now();
    const esiResponse = await fetchEsi(endpoint, method, body, accessToken, userAgent);
    const responseTime = Date.now() - startTime;

    // Log request
    await logEsiRequest(supabase, characterId, endpoint, method, esiResponse.status, responseTime, userAgent);

    return new Response(
      JSON.stringify({
        data: esiResponse.data,
        headers: esiResponse.headers
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('ESI Core Proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: error.code,
        statusCode: error.statusCode
      }),
      { 
        status: error.statusCode || 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getValidToken(supabase: any, characterId: number): Promise<string> {
  // First check esi_service_tokens
  const { data: tokenData } = await supabase
    .from('esi_service_tokens')
    .select('access_token, expires_at, refresh_token')
    .eq('character_id', characterId)
    .single();

  if (tokenData) {
    const expiresAt = new Date(tokenData.expires_at);
    
    // Token is still valid
    if (expiresAt > new Date(Date.now() + 60000)) { // 1 minute buffer
      return tokenData.access_token;
    }
    
    // Token expired, refresh it
    const newToken = await refreshToken(supabase, characterId, tokenData.refresh_token);
    return newToken;
  }

  // Fallback to eve_characters table
  const { data: charData } = await supabase
    .from('eve_characters')
    .select('access_token, expires_at, refresh_token')
    .eq('character_id', characterId)
    .single();

  if (!charData) {
    throw new Error('Character not found');
  }

  const expiresAt = new Date(charData.expires_at);
  
  if (expiresAt > new Date(Date.now() + 60000)) {
    // Sync to esi_service_tokens
    await syncTokenToEsiService(supabase, characterId, charData);
    return charData.access_token;
  }

  // Token expired, refresh it
  const newToken = await refreshToken(supabase, characterId, charData.refresh_token);
  return newToken;
}

async function refreshToken(supabase: any, characterId: number, refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('EVE_CLIENT_ID');
  const clientSecret = Deno.env.get('EVE_CLIENT_SECRET');

  const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Update esi_service_tokens
  await supabase
    .from('esi_service_tokens')
    .upsert({
      character_id: characterId,
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: expiresAt.toISOString(),
      scopes: data.scope ? data.scope.split(' ') : [],
      updated_at: new Date().toISOString()
    });

  // Also update eve_characters
  await supabase
    .from('eve_characters')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('character_id', characterId);

  return data.access_token;
}

async function syncTokenToEsiService(supabase: any, characterId: number, charData: any): Promise<void> {
  await supabase
    .from('esi_service_tokens')
    .upsert({
      character_id: characterId,
      access_token: charData.access_token,
      refresh_token: charData.refresh_token,
      expires_at: charData.expires_at,
      scopes: charData.scopes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
}

async function fetchEsi(
  endpoint: string,
  method: string,
  body: any,
  accessToken: string | null,
  userAgent: string
): Promise<{ data: any; status: number; headers: Record<string, string> }> {
  // Ensure endpoint starts with /
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  const url = `${ESI_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'User-Agent': userAgent || 'EVE Portal Aether/3.0'
  };

  // Add authorization if token provided
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const options: RequestInit = {
    method,
    headers
  };

  // Handle POST/PUT body
  if (body && (method === 'POST' || method === 'PUT')) {
    // Validate body for bulk operations
    if (endpoint.includes('/universe/names/')) {
      if (!Array.isArray(body)) {
        throw new Error('Body must be an array for /universe/names/');
      }
      if (body.length === 0) {
        throw new Error('Body array cannot be empty');
      }
      if (body.length > 1000) {
        throw new Error('Body array cannot exceed 1000 items');
      }
      
      // ESI int32 limits
      const INT32_MAX = 2147483647;
      const INT32_MIN = -2147483648;
      
      // Validate all items are valid int32 numbers
      const invalidIds = body.filter(id => 
        typeof id !== 'number' || 
        !Number.isInteger(id) || 
        id <= 0 || 
        id < INT32_MIN || 
        id > INT32_MAX
      );
      
      if (invalidIds.length > 0) {
        throw new Error(`Invalid IDs detected (must be positive int32): ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''}`);
      }
    }
    
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  console.log(`ESI Request: ${method} ${url}`, body ? `(${Array.isArray(body) ? body.length : 1} items)` : '');

  const response = await fetch(url, options);
  
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (parseError: any) {
    console.error('Failed to parse ESI response:', parseError);
    throw new Error(`Failed to parse ESI response: ${parseError?.message || 'Unknown error'}`);
  }

  if (!response.ok) {
    console.error(`ESI Error ${response.status}:`, data);
    
    const error: any = new Error(
      `ESI returned ${response.status}: ${response.statusText}`
    );
    error.statusCode = response.status;
    error.data = data;
    error.endpoint = endpoint;
    
    // Add specific error messages for common issues
    if (response.status === 400) {
      error.message = `Bad Request to ${endpoint}: ${JSON.stringify(data)}`;
    } else if (response.status === 401) {
      error.message = `Unauthorized access to ${endpoint} - token may be expired`;
    } else if (response.status === 403) {
      error.message = `Forbidden - insufficient scopes for ${endpoint}`;
    } else if (response.status === 404) {
      error.message = `Resource not found: ${endpoint}`;
    } else if (response.status === 420) {
      error.message = `Rate limited - too many requests`;
    }
    
    throw error;
  }

  console.log(`ESI Success: ${method} ${url} (${response.status})`);

  return {
    data,
    status: response.status,
    headers: responseHeaders
  };
}

async function logEsiRequest(
  supabase: any,
  characterId: number | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  userAgent: string
): Promise<void> {
  try {
    await supabase
      .from('esi_service_request_logs')
      .insert({
        character_id: characterId,
        endpoint,
        method,
        status_code: statusCode,
        response_time_ms: responseTime,
        user_agent: userAgent,
        accessed_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log ESI request:', error);
  }
}
