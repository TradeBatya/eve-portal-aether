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

      // Check if user has admin-level privileges (hierarchy >= 80)
      const { data: hasAdminRole, error: adminRoleError } = await supabase.rpc('has_role_level', {
        user_uuid: user.id,
        min_level: 80,
      });

      if (adminRoleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, roleName, expiresAt, reason } = await req.json();

    if (action === 'grant') {
        // Look up the role identifier
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

        // Grant role to user
        const { data: existingRole, error: checkError } = await supabase
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
            role_name: roleRecord.name,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt || null,
        });

      if (insertError) throw insertError;

      // Log the action
      await supabase.from('role_assignment_logs').insert({
        user_id: userId,
          role_name: roleRecord.name,
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
          role_name: roleRecord.name,
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

        const { data: userRoles, error: userRolesError } = await supabase
          .from('user_roles')
          .select('user_id, role_id, role_name, granted_at, expires_at');

        if (userRolesError) throw userRolesError;

        const rolesByUser = (userRoles || []).reduce<Record<string, any[]>>((acc, current) => {
          const list = acc[current.user_id] ?? [];
          list.push({
            role_id: current.role_id,
            role_name: current.role_name,
            granted_at: current.granted_at,
            expires_at: current.expires_at,
          });
          acc[current.user_id] = list;
          return acc;
        }, {});

        const usersWithRoles = profiles.map((profile) => ({
          ...profile,
          roles: rolesByUser[profile.id] ?? [],
        }));

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