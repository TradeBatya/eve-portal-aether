import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EveCharacterRoles {
  roles: string[];
  roles_at_hq: string[];
  roles_at_base: string[];
  roles_at_other: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, characterId } = await req.json();

    console.log(`Syncing EVE roles for user ${userId}, character ${characterId}`);

    // Get character data
    const { data: character, error: charError } = await supabaseAdmin
      .from('eve_characters')
      .select('character_id, access_token, corporation_id')
      .eq('id', characterId)
      .eq('user_id', userId)
      .single();

    if (charError || !character) {
      throw new Error('Character not found');
    }

    // Fetch character roles from ESI
    const esiResponse = await fetch(
      `https://esi.evetech.net/latest/characters/${character.character_id}/roles/`,
      {
        headers: {
          'Authorization': `Bearer ${character.access_token}`,
        },
      }
    );

    if (!esiResponse.ok) {
      throw new Error(`ESI request failed: ${esiResponse.statusText}`);
    }

    const eveRoles: EveCharacterRoles = await esiResponse.json();
    console.log('EVE roles retrieved:', eveRoles.roles);

    // Get corporation role mappings
    const { data: mappings, error: mappingsError } = await supabaseAdmin
      .from('corporation_role_mappings')
      .select('eve_role_name, system_role_name, auto_assign')
      .or(`corporation_id.eq.${character.corporation_id},corporation_id.eq.0`)
      .eq('auto_assign', true);

    if (mappingsError) {
      console.error('Error fetching mappings:', mappingsError);
    }

    const rolesToGrant: string[] = [];

    // Map EVE roles to system roles
    if (mappings && mappings.length > 0) {
      for (const mapping of mappings) {
        if (eveRoles.roles.includes(mapping.eve_role_name)) {
          rolesToGrant.push(mapping.system_role_name);
        }
      }
    }

    // Grant roles that should be assigned
    for (const roleToGrant of rolesToGrant) {
      // Check if user already has this role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', roleToGrant)
        .maybeSingle();

      if (!existingRole) {
        // Grant the role
        const { error: grantError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: roleToGrant,
            granted_by: null, // Automatic assignment
            granted_at: new Date().toISOString(),
          });

        if (grantError) {
          console.error(`Error granting role ${roleToGrant}:`, grantError);
        } else {
          // Log the assignment
          await supabaseAdmin.from('role_assignment_logs').insert({
            user_id: userId,
            role_name: roleToGrant,
            action: 'granted',
            reason: `Automatic assignment from EVE role: ${roleToGrant}`,
            metadata: { character_id: character.character_id, eve_roles: eveRoles.roles },
          });

          console.log(`Granted role ${roleToGrant} to user ${userId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        rolesGranted: rolesToGrant,
        eveRoles: eveRoles.roles,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-eve-roles function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});