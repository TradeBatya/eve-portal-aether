import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProxyRequest {
  endpoint: string;
  method?: string;
  body?: any;
  characterId?: number;
}

// TokenManager logic - integrated from client-side
class EdgeTokenManager {
  private static REFRESH_BUFFER = 10 * 60 * 1000; // 10 minutes

  static async getValidToken(supabase: any, characterId: number): Promise<string> {
    if (!characterId || characterId <= 0) {
      throw new Error('Invalid characterId provided');
    }

    // Try esi_service_tokens first
    const { data: tokenData, error: tokenError } = await supabase
      .from('esi_service_tokens')
      .select('access_token, expires_at, refresh_token')
      .eq('character_id', characterId)
      .maybeSingle();

    if (tokenError && tokenError.code !== 'PGRST116') {
      console.error('[TokenManager] Error fetching token:', tokenError);
    }

    if (tokenData) {
      const expiryTime = new Date(tokenData.expires_at).getTime();
      const now = Date.now();
      const expiresIn = expiryTime - now;

      if (expiresIn < 0) {
        // Token expired, refresh it
        return await this.refreshToken(supabase, characterId, tokenData.refresh_token);
      }

      if (expiresIn < this.REFRESH_BUFFER) {
        // Token needs refresh soon
        return await this.refreshToken(supabase, characterId, tokenData.refresh_token);
      }

      return tokenData.access_token;
    }

    // Fallback to eve_characters
    const { data: charData, error: charError } = await supabase
      .from('eve_characters')
      .select('access_token, expires_at, refresh_token')
      .eq('character_id', characterId)
      .maybeSingle();

    if (charError) {
      console.error('[TokenManager] Error fetching character token:', charError);
      throw new Error(`Failed to get token for character ${characterId}: ${charError.message}`);
    }

    if (!charData) {
      throw new Error(`No token found for character ${characterId}`);
    }

    const expiryTime = new Date(charData.expires_at).getTime();
    const now = Date.now();
    const expiresIn = expiryTime - now;

    if (expiresIn < this.REFRESH_BUFFER) {
      return await this.refreshToken(supabase, characterId, charData.refresh_token);
    }

    // Sync to esi_service_tokens
    await this.syncToken(supabase, characterId, charData);

    return charData.access_token;
  }

  static async refreshToken(supabase: any, characterId: number, refreshToken: string): Promise<string> {
    const clientId = Deno.env.get('EVE_CLIENT_ID');
    const clientSecret = Deno.env.get('EVE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('EVE_CLIENT_ID or EVE_CLIENT_SECRET not configured');
    }

    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token refresh failed: ${errorText}`);
      
      // Increment failure count
      await supabase.rpc('increment_token_failures', { char_id: characterId });
      
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    // Update both tables
    await supabase
      .from('esi_service_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: expiresAt,
        last_validated_at: new Date().toISOString(),
        validation_failures: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('character_id', characterId);

    await supabase
      .from('eve_characters')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('character_id', characterId);

    console.log(`[TokenManager] Successfully refreshed token for character ${characterId}`);
    return data.access_token;
  }

  static async syncToken(supabase: any, characterId: number, charData: any): Promise<void> {
    try {
      await supabase
        .from('esi_service_tokens')
        .upsert({
          character_id: characterId,
          access_token: charData.access_token,
          refresh_token: charData.refresh_token,
          expires_at: charData.expires_at,
          scopes: charData.scopes,
          token_type: 'Bearer',
          last_validated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error(`Token sync failed for character ${characterId}:`, error);
    }
  }
}

// CacheManager logic - integrated from client-side
class EdgeCacheManager {
  static async get<T>(supabase: any, key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('esi_service_cache')
        .select('data, expires_at, access_count')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Update access count
      await supabase
        .from('esi_service_cache')
        .update({ 
          access_count: (data.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('cache_key', key);

      console.log(`[Cache] HIT: ${key}`);
      return data.data as T;

    } catch (error) {
      console.error('[Cache] Read error:', error);
      return null;
    }
  }

  static async set(supabase: any, key: string, data: any, ttl: number, options: { tags?: string[]; priority?: number } = {}): Promise<void> {
    if (!key || !data) {
      console.warn('[Cache] Invalid cache set - missing key or data');
      return;
    }

    try {
      const endpoint = key.split(':')[0] || 'unknown';
      const characterIdMatch = key.match(/char:(\d+)/);
      const characterId = characterIdMatch ? parseInt(characterIdMatch[1]) : null;

      await supabase
        .from('esi_service_cache')
        .upsert({
          cache_key: key,
          endpoint,
          character_id: characterId,
          data,
          expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
          tags: options.tags || [],
          priority: options.priority || 0,
          access_count: 0
        });

      console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('[Cache] Write error:', error);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { endpoint, method = 'GET', body, characterId }: ProxyRequest = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'endpoint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ESI-Proxy] ${method} ${endpoint} (characterId: ${characterId || 'none'})`);

    // Generate cache key
    const cacheKey = characterId 
      ? `${endpoint}:char:${characterId}${body ? ':' + JSON.stringify(body) : ''}`
      : `${endpoint}${body ? ':' + JSON.stringify(body) : ''}`;

    // Try cache first (for GET requests)
    if (method === 'GET') {
      const cached = await EdgeCacheManager.get(supabase, cacheKey);
      if (cached) {
        const responseTime = Date.now() - startTime;
        
        // Log cache hit
        await logRequest(supabase, {
          endpoint,
          method,
          characterId,
          statusCode: 200,
          responseTime,
          cacheHit: true,
          body,
        });

        return new Response(
          JSON.stringify(cached),
          { 
            status: 200,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'X-Response-Time': `${responseTime}ms`
            } 
          }
        );
      }
    }

    // Get access token if characterId provided
    let accessToken: string | undefined;
    if (characterId) {
      try {
        accessToken = await EdgeTokenManager.getValidToken(supabase, characterId);
      } catch (error: any) {
        return new Response(
          JSON.stringify({ error: `Token error: ${error.message}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Make ESI request
    const esiUrl = `https://esi.evetech.net/latest${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'EVE-Portal-Aether/1.0'
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const esiResponse = await fetch(esiUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseTime = Date.now() - startTime;
    const responseData = await esiResponse.json();

    // Log request
    await logRequest(supabase, {
      endpoint,
      method,
      characterId,
      statusCode: esiResponse.status,
      responseTime,
      cacheHit: false,
      body,
      responseBody: esiResponse.ok ? undefined : responseData,
      errorMessage: esiResponse.ok ? undefined : responseData.error
    });

    if (!esiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: responseData.error || 'ESI request failed',
          status: esiResponse.status,
          details: responseData
        }),
        { 
          status: esiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Cache successful GET responses
    if (method === 'GET' && esiResponse.ok) {
      const ttl = determineTTL(endpoint);
      await EdgeCacheManager.set(supabase, cacheKey, responseData, ttl, {
        tags: [endpoint.split('/')[1] || 'unknown'],
        priority: 1
      });
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'X-Response-Time': `${responseTime}ms`
        } 
      }
    );

  } catch (error: any) {
    console.error('[ESI-Proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function logRequest(supabase: any, data: {
  endpoint: string;
  method: string;
  characterId?: number;
  statusCode: number;
  responseTime: number;
  cacheHit: boolean;
  body?: any;
  responseBody?: any;
  errorMessage?: string;
}) {
  try {
    await supabase.from('esi_service_request_logs').insert({
      endpoint: data.endpoint,
      method: data.method,
      character_id: data.characterId || null,
      status_code: data.statusCode,
      response_time_ms: data.responseTime,
      cache_hit: data.cacheHit,
      request_body: data.body || null,
      response_body: data.responseBody || null,
      error_message: data.errorMessage || null,
    });
  } catch (error) {
    console.error('[ESI-Proxy] Failed to log request:', error);
  }
}

function determineTTL(endpoint: string): number {
  // Realtime data (30s-1m)
  if (endpoint.includes('/location/') || endpoint.includes('/ship/') || endpoint.includes('/online/')) {
    return 60; // 1 minute
  }
  
  // Frequent updates (5-15m)
  if (endpoint.includes('/wallet/') || endpoint.includes('/skills/')) {
    return 300; // 5 minutes
  }
  
  // Moderate updates (1-6h)
  if (endpoint.includes('/assets/') || endpoint.includes('/contacts/') || endpoint.includes('/skillqueue/')) {
    return 3600; // 1 hour
  }
  
  // Rare updates (24h-30d)
  if (endpoint.includes('/characters/') || endpoint.includes('/universe/names/') || endpoint.includes('/universe/types/')) {
    return 86400; // 24 hours
  }
  
  // Default: 5 minutes
  return 300;
}
