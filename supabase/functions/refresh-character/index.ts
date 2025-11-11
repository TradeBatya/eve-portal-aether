import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESICharacterInfo {
  corporation_id: number;
  alliance_id?: number;
}

interface ESICorporationInfo {
  name: string;
  ticker: string;
  alliance_id?: number;
}

interface ESIAllianceInfo {
  name: string;
  ticker: string;
}

interface ESILocationInfo {
  solar_system_id: number;
}

interface ESISystemInfo {
  name: string;
}

interface ESIShipInfo {
  ship_type_id: number;
}

interface ESITypeInfo {
  name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { characterId, userId } = await req.json();

    if (!characterId) {
      throw new Error('Character ID is required');
    }

    console.log('Refreshing character data for:', characterId);

    // Get character data from database
    const { data: character, error: charError } = await supabase
      .from('eve_characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (charError || !character) {
      throw new Error('Character not found');
    }

    console.log('Character found:', character.character_name);

    // Check if access token needs refresh
    let accessToken = character.access_token;
    const expiresAt = new Date(character.expires_at);
    
    if (expiresAt <= new Date()) {
      console.log('Access token expired, refreshing...');
      
      const clientId = Deno.env.get('EVE_CLIENT_ID');
      const clientSecret = Deno.env.get('EVE_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        throw new Error('EVE OAuth credentials not configured');
      }

      const tokenResponse = await fetch('https://login.eveonline.com/v2/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: character.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      // Update tokens in database
      await supabase
        .from('eve_characters')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || character.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq('id', characterId);

      console.log('Token refreshed successfully');
    }

    // Fetch character info from ESI
    const charInfoResponse = await fetch(
      `https://esi.evetech.net/latest/characters/${character.character_id}/?datasource=tranquility`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!charInfoResponse.ok) {
      throw new Error('Failed to fetch character info from ESI');
    }

    const charInfo: ESICharacterInfo = await charInfoResponse.json();
    console.log('Character info fetched:', charInfo);

    // Fetch corporation info
    const corpResponse = await fetch(
      `https://esi.evetech.net/latest/corporations/${charInfo.corporation_id}/?datasource=tranquility`
    );

    if (!corpResponse.ok) {
      throw new Error('Failed to fetch corporation info');
    }

    const corpInfo: ESICorporationInfo = await corpResponse.json();
    console.log('Corporation info fetched:', corpInfo.name);

    // Fetch alliance info if exists
    let allianceName = null;
    let allianceId = charInfo.alliance_id || corpInfo.alliance_id || null;

    if (allianceId) {
      const allianceResponse = await fetch(
        `https://esi.evetech.net/latest/alliances/${allianceId}/?datasource=tranquility`
      );

      if (allianceResponse.ok) {
        const allianceInfo: ESIAllianceInfo = await allianceResponse.json();
        allianceName = allianceInfo.name;
        console.log('Alliance info fetched:', allianceName);
      }
    }

    // Fetch wallet balance
    const walletResponse = await fetch(
      `https://esi.evetech.net/latest/characters/${character.character_id}/wallet/?datasource=tranquility`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let walletBalance = null;
    if (walletResponse.ok) {
      walletBalance = await walletResponse.json();
      console.log('Wallet balance fetched:', walletBalance);
    }

    // Fetch location
    const locationResponse = await fetch(
      `https://esi.evetech.net/latest/characters/${character.character_id}/location/?datasource=tranquility`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let locationSystemId = null;
    let locationSystemName = null;

    if (locationResponse.ok) {
      const locationInfo: ESILocationInfo = await locationResponse.json();
      locationSystemId = locationInfo.solar_system_id;

      // Fetch system name
      const systemResponse = await fetch(
        `https://esi.evetech.net/latest/universe/systems/${locationSystemId}/?datasource=tranquility`
      );

      if (systemResponse.ok) {
        const systemInfo: ESISystemInfo = await systemResponse.json();
        locationSystemName = systemInfo.name;
        console.log('Location fetched:', locationSystemName);
      }
    }

    // Fetch ship info
    const shipResponse = await fetch(
      `https://esi.evetech.net/latest/characters/${character.character_id}/ship/?datasource=tranquility`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let shipTypeId = null;
    let shipTypeName = null;

    if (shipResponse.ok) {
      const shipInfo: ESIShipInfo = await shipResponse.json();
      shipTypeId = shipInfo.ship_type_id;

      // Fetch ship type name
      const typeResponse = await fetch(
        `https://esi.evetech.net/latest/universe/types/${shipTypeId}/?datasource=tranquility`
      );

      if (typeResponse.ok) {
        const typeInfo: ESITypeInfo = await typeResponse.json();
        shipTypeName = typeInfo.name;
        console.log('Ship info fetched:', shipTypeName);
      }
    }

    // Update character data
    const { error: updateError } = await supabase
      .from('eve_characters')
      .update({
        corporation_id: charInfo.corporation_id,
        corporation_name: corpInfo.name,
        alliance_id: allianceId,
        alliance_name: allianceName,
        wallet_balance: walletBalance,
        location_system_id: locationSystemId,
        location_system_name: locationSystemName,
        ship_type_id: shipTypeId,
        ship_type_name: shipTypeName,
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', characterId);

    if (updateError) {
      throw updateError;
    }

    console.log('Character data updated successfully');

    // Sync EVE roles after successful character refresh
    if (userId) {
      try {
        console.log('Syncing EVE roles...');
        const syncResponse = await fetch(
          `${supabaseUrl}/functions/v1/sync-eve-roles`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ userId, characterId }),
          }
        );

        if (!syncResponse.ok) {
          const errorText = await syncResponse.text();
          console.error('Failed to sync EVE roles:', errorText);
        } else {
          const syncResult = await syncResponse.json();
          console.log('EVE roles synced successfully:', syncResult);
        }
      } catch (syncError) {
        console.error('Error calling sync-eve-roles:', syncError);
        // Don't fail the entire request if role sync fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Character data refreshed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error refreshing character:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to refresh character data',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
