import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!;
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state, userId } = await req.json();

    console.log('Discord auth callback received', { userId, hasCode: !!code, hasState: !!state });

    if (!code) {
      throw new Error('No authorization code provided');
    }

    // Exchange code for access token
    const redirectUri = `${req.headers.get('origin') || 'https://preview--eve-portal-aether.lovable.app'}/auth/discord/callback`;
    
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    console.log('Token exchange successful');

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Failed to get user info:', errorData);
      throw new Error('Failed to get user info from Discord');
    }

    const discordUser = await userResponse.json();
    console.log('Discord user info retrieved:', { id: discordUser.id, username: discordUser.username });

    // Update user profile with Discord info
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Format username based on discriminator
    const formattedUsername = discordUser.discriminator === '0' 
      ? discordUser.username 
      : `${discordUser.username}#${discordUser.discriminator}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        discord_user_id: discordUser.id,
        discord_username: formattedUsername,
        discord_avatar: discordUser.avatar,
        discord_email: discordUser.email,
        discord_access_token: access_token,
        discord_refresh_token: refresh_token,
        discord_connected_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Failed to save Discord data');
    }

    console.log('Profile updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        discordUser: {
          id: discordUser.id,
          username: formattedUsername,
          avatar: discordUser.avatar,
          email: discordUser.email,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Discord auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Discord authentication failed';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});