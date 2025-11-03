import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CHARACTERS_PER_USER = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    const clientId = Deno.env.get('EVE_CLIENT_ID');
    const clientSecret = Deno.env.get('EVE_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('EVE credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If userId is provided, check if user already has 3 characters
    if (userId) {
      const { data: existingCharacters, error: countError } = await supabase
        .from('eve_characters')
        .select('id')
        .eq('user_id', userId);

      if (countError) {
        console.error('Error checking character count:', countError);
        throw new Error('Failed to check character count');
      }

      if (existingCharacters && existingCharacters.length >= MAX_CHARACTERS_PER_USER) {
        throw new Error(`Maximum ${MAX_CHARACTERS_PER_USER} characters per account`);
      }
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

    // Get character corporation info
    const characterInfoResponse = await fetch(
      `https://esi.evetech.net/latest/characters/${characterData.CharacterID}/?datasource=tranquility`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    );

    let corporationId = null;
    let corporationName = null;
    
    if (characterInfoResponse.ok) {
      const charInfo = await characterInfoResponse.json();
      corporationId = charInfo.corporation_id;
      
      // Get corporation name
      const corpResponse = await fetch(
        `https://esi.evetech.net/latest/corporations/${corporationId}/?datasource=tranquility`
      );
      
      if (corpResponse.ok) {
        const corpInfo = await corpResponse.json();
        corporationName = corpInfo.name;
      }
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const scopes = characterData.Scopes ? characterData.Scopes.split(' ') : [];

    // If userId is provided, add character to existing user
    if (userId) {
      // Check if character already exists
      const { data: existingChar } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('character_id', characterData.CharacterID)
        .single();

      if (existingChar) {
        // Update existing character
        const { error: updateError } = await supabase
          .from('eve_characters')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
            scopes: scopes,
            updated_at: new Date().toISOString(),
          })
          .eq('character_id', characterData.CharacterID);

        if (updateError) throw updateError;
      } else {
        // Insert new character
        const { error: insertError } = await supabase
          .from('eve_characters')
          .insert({
            user_id: userId,
            character_id: characterData.CharacterID,
            character_name: characterData.CharacterName,
            character_owner_hash: characterData.CharacterOwnerHash,
            corporation_id: corporationId,
            corporation_name: corporationName,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
            scopes: scopes,
          });

        if (insertError) throw insertError;
      }

      return new Response(JSON.stringify({
        success: true,
        character_name: characterData.CharacterName,
        character_id: characterData.CharacterID,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no userId, create new auth user
    const email = `${characterData.CharacterID}@eve.local`;
    let authUserId: string;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      authUserId = existingUser.id;
      
      // Update user metadata
      await supabase.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          character_id: characterData.CharacterID,
          character_name: characterData.CharacterName,
          character_owner_hash: characterData.CharacterOwnerHash,
        },
      });
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          character_id: characterData.CharacterID,
          character_name: characterData.CharacterName,
          character_owner_hash: characterData.CharacterOwnerHash,
        },
      });

      if (createError) throw createError;
      authUserId = newUser.user.id;
    }

    // Save character data
    const { data: existingChar } = await supabase
      .from('eve_characters')
      .select('*')
      .eq('character_id', characterData.CharacterID)
      .single();

    if (existingChar) {
      await supabase
        .from('eve_characters')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          scopes: scopes,
          updated_at: new Date().toISOString(),
        })
        .eq('character_id', characterData.CharacterID);
    } else {
      await supabase
        .from('eve_characters')
        .insert({
          user_id: authUserId,
          character_id: characterData.CharacterID,
          character_name: characterData.CharacterName,
          character_owner_hash: characterData.CharacterOwnerHash,
          corporation_id: corporationId,
          corporation_name: corporationName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          scopes: scopes,
        });
    }

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

  } catch (error) {
    console.error('EVE auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
