import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or higher permission level
    const { data: hasAdminAccess } = await supabase.rpc('has_minimum_role_level', {
      user_uuid: user.id,
      required_level: 80
    });

    if (!hasAdminAccess) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, roleName, expiresAt, reason } = await req.json();

    if (action === 'grant') {
      // Resolve requested role
      const { data: roleRecord, error: roleLookupError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', roleName)
        .maybeSingle();

      if (roleLookupError || !roleRecord) {
        return new Response(
          JSON.stringify({ error: 'Role not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Grant role to user if not already assigned
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleRecord.id)
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: 'User already has this role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleRecord.id,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt || null,
        });

      if (insertError) throw insertError;

      // Log the action
      await supabase.from('role_assignment_logs').insert({
        user_id: userId,
        role_name: roleName,
        action: 'granted',
        granted_by: user.id,
        reason: reason || 'Manual assignment by admin',
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Role granted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'revoke') {
      const { data: roleRecord, error: roleLookupError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', roleName)
        .maybeSingle();

      if (roleLookupError || !roleRecord) {
        return new Response(
          JSON.stringify({ error: 'Role not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Revoke role from user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleRecord.id);

      if (deleteError) throw deleteError;

      // Log the action
      await supabase.from('role_assignment_logs').insert({
        user_id: userId,
        role_name: roleName,
        action: 'revoked',
        granted_by: user.id,
        reason: reason || 'Manual revocation by admin',
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Role revoked successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

      if (action === 'list_users') {
        // Get all users with their roles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            discord_username,
            created_at
          `);

        if (profilesError) throw profilesError;

        const profileList = profiles ?? [];

        const usersWithRoles = await Promise.all(
          profileList.map(async (profile) => {
            const { data: userRoles, error: userRolesError } = await supabase
              .from('user_roles')
              .select('granted_at, expires_at, roles(name, hierarchy_level)')
              .eq('user_id', profile.id);

            if (userRolesError) throw userRolesError;

            const formattedRoles = (userRoles || [])
              .map((role) => ({
                name: role.roles?.name ?? '',
                hierarchy_level: role.roles?.hierarchy_level ?? 0,
                granted_at: role.granted_at,
                expires_at: role.expires_at,
              }))
              .filter((role) => role.name.length > 0);

            return {
              ...profile,
              roles: formattedRoles,
            };
          })
        );

        return new Response(
          JSON.stringify({ users: usersWithRoles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    if (action === 'get_permissions') {
      // Get user permissions
      const { data: permissions, error: permError } = await supabase
        .rpc('get_user_permissions', { user_uuid: userId || user.id });

      if (permError) throw permError;

      return new Response(
        JSON.stringify({ permissions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-roles function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});