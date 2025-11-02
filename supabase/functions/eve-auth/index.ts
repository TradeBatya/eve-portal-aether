import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    const clientId = Deno.env.get('EVE_CLIENT_ID');
    const clientSecret = Deno.env.get('EVE_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('EVE credentials not configured');
    }

    console.log('Exchanging code for token...');

    // Exchange code for token
    const tokenResponse = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token received, verifying...');

    // Verify token and get character info
    const verifyResponse = await fetch('https://esi.evetech.net/verify/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!verifyResponse.ok) {
      throw new Error('Token verification failed');
    }

    const characterData = await verifyResponse.json();
    console.log('Character verified:', characterData.CharacterName);

    // Create or update user in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user with EVE character ID as identifier
    const email = `${characterData.CharacterID}@eve.local`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        character_id: characterData.CharacterID,
        character_name: characterData.CharacterName,
        character_owner_hash: characterData.CharacterOwnerHash,
      },
    });

    if (authError) {
      // User might already exist, try to get it
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser?.users.find(u => u.email === email);
      
      if (user) {
        // Update user metadata
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            character_id: characterData.CharacterID,
            character_name: characterData.CharacterName,
            character_owner_hash: characterData.CharacterOwnerHash,
          },
        });

        // Generate session
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });

        if (sessionError) throw sessionError;

        return new Response(JSON.stringify({
          character_name: characterData.CharacterName,
          character_id: characterData.CharacterID,
          session_url: sessionData.properties.action_link,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw authError;
    }

    // Generate session for new user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) throw sessionError;

    return new Response(JSON.stringify({
      character_name: characterData.CharacterName,
      character_id: characterData.CharacterID,
      session_url: sessionData.properties.action_link,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('EVE auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
