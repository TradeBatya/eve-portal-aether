import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TokenRefresh] Starting background token refresh...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all tokens that need refresh (expire in next 10 minutes)
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const { data: expiredTokens, error: fetchError } = await supabase
      .from('esi_service_tokens')
      .select('character_id, refresh_token, expires_at')
      .lt('expires_at', tenMinutesFromNow)
      .eq('auto_refresh_enabled', true);

    if (fetchError) {
      console.error('[TokenRefresh] Error fetching tokens:', fetchError);
      throw fetchError;
    }

    if (!expiredTokens || expiredTokens.length === 0) {
      console.log('[TokenRefresh] No tokens need refresh');
      return new Response(
        JSON.stringify({ message: 'No tokens need refresh', refreshed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[TokenRefresh] Found ${expiredTokens.length} tokens to refresh`);

    const results = await Promise.allSettled(
      expiredTokens.map(async (token) => {
        try {
          const newToken = await refreshToken(token.character_id, token.refresh_token);
          
          // Update esi_service_tokens
          await supabase
            .from('esi_service_tokens')
            .update({
              access_token: newToken.access_token,
              refresh_token: newToken.refresh_token || token.refresh_token,
              expires_at: newToken.expires_at,
              last_validated_at: new Date().toISOString(),
              validation_failures: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('character_id', token.character_id);

          // Also update eve_characters
          await supabase
            .from('eve_characters')
            .update({
              access_token: newToken.access_token,
              refresh_token: newToken.refresh_token || token.refresh_token,
              expires_at: newToken.expires_at,
              updated_at: new Date().toISOString(),
            })
            .eq('character_id', token.character_id);

          console.log(`[TokenRefresh] Successfully refreshed token for character ${token.character_id}`);
          return { characterId: token.character_id, success: true };
        } catch (error: any) {
          console.error(`[TokenRefresh] Failed to refresh token for character ${token.character_id}:`, error);
          
          // Increment validation_failures
          await supabase.rpc('increment_token_failures', { 
            char_id: token.character_id 
          });
          
          return { characterId: token.character_id, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    console.log(`[TokenRefresh] Completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Token refresh completed',
        total: expiredTokens.length,
        successful,
        failed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TokenRefresh] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function refreshToken(characterId: number, refreshToken: string) {
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
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    scopes: data.scope ? data.scope.split(' ') : [],
  };
}
