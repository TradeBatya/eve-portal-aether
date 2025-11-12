import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationData {
  user_id: string;
  character_id: number;
  type: 'new_contract' | 'skill_completed';
  title: string;
  message: string;
  metadata: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Member Audit auto-sync with notifications...');

    // Get all characters that have tokens
    const { data: characters, error: charsError } = await supabase
      .from('eve_characters')
      .select('character_id, character_name, user_id, access_token, refresh_token, token_expires_at')
      .not('access_token', 'is', null);

    if (charsError) {
      console.error('Error fetching characters:', charsError);
      throw charsError;
    }

    if (!characters || characters.length === 0) {
      console.log('No characters with tokens found');
      return new Response(
        JSON.stringify({ message: 'No characters to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${characters.length} characters to sync`);

    const notifications: NotificationData[] = [];
    const results = [];

    // Process each character
    for (const character of characters) {
      try {
        console.log(`Syncing character ${character.character_name} (${character.character_id})`);
        
        // Get current contracts before sync
        const { data: oldContracts } = await supabase
          .from('member_audit_contracts')
          .select('contract_id')
          .eq('character_id', character.character_id);

        const oldContractIds = new Set(oldContracts?.map(c => c.contract_id) || []);

        // Get current skill queue before sync
        const { data: oldSkillQueue } = await supabase
          .from('member_audit_skillqueue')
          .select('skill_id, finished_level, finish_date')
          .eq('character_id', character.character_id)
          .order('queue_position', { ascending: true })
          .limit(1);

        // Call sync function
        const { data, error } = await supabase.functions.invoke('update-member-audit', {
          body: { character_id: character.character_id }
        });

        if (error) {
          console.error(`Error syncing character ${character.character_id}:`, error);
          results.push({
            character_id: character.character_id,
            character_name: character.character_name,
            success: false,
            error: error.message
          });
          continue;
        }

        // Check for new contracts
        const { data: newContracts } = await supabase
          .from('member_audit_contracts')
          .select('contract_id, type, status, issuer_name, date_issued')
          .eq('character_id', character.character_id);

        const newContractsList = newContracts?.filter(c => !oldContractIds.has(c.contract_id)) || [];
        
        if (newContractsList.length > 0) {
          for (const contract of newContractsList) {
            notifications.push({
              user_id: character.user_id,
              character_id: character.character_id,
              type: 'new_contract',
              title: 'New Contract',
              message: `${character.character_name} received a new ${contract.type} contract from ${contract.issuer_name}`,
              metadata: {
                contract_id: contract.contract_id,
                type: contract.type,
                status: contract.status,
                date_issued: contract.date_issued
              }
            });
          }
        }

        // Check for completed skills
        if (oldSkillQueue && oldSkillQueue.length > 0) {
          const oldSkill = oldSkillQueue[0];
          const finishDate = new Date(oldSkill.finish_date);
          
          if (finishDate < new Date()) {
            // Skill should be completed now
            const { data: completedSkill } = await supabase
              .from('member_audit_skills')
              .select('skill_name, trained_skill_level')
              .eq('character_id', character.character_id)
              .eq('skill_id', oldSkill.skill_id)
              .single();

            if (completedSkill && completedSkill.trained_skill_level >= oldSkill.finished_level) {
              notifications.push({
                user_id: character.user_id,
                character_id: character.character_id,
                type: 'skill_completed',
                title: 'Skill Training Completed',
                message: `${character.character_name} completed training ${completedSkill.skill_name} to level ${completedSkill.trained_skill_level}`,
                metadata: {
                  skill_name: completedSkill.skill_name,
                  level: completedSkill.trained_skill_level
                }
              });
            }
          }
        }

        console.log(`Successfully synced character ${character.character_name}`);
        results.push({
          character_id: character.character_id,
          character_name: character.character_name,
          success: true,
          new_contracts: newContractsList.length,
          data
        });
      } catch (err) {
        console.error(`Exception syncing character ${character.character_id}:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        results.push({
          character_id: character.character_id,
          character_name: character.character_name,
          success: false,
          error: errorMessage
        });
      }
    }

    // Send notifications
    if (notifications.length > 0) {
      console.log(`Sending ${notifications.length} notifications`);
      
      const { error: notifError } = await supabase
        .from('ping_notifications')
        .insert(
          notifications.map(n => ({
            title: n.title,
            message: n.message,
            priority: n.type === 'new_contract' ? 'high' : 'normal',
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            created_by: n.user_id
          }))
        );

      if (notifError) {
        console.error('Error creating notifications:', notifError);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Sync completed: ${successCount} succeeded, ${failureCount} failed, ${notifications.length} notifications sent`);

    return new Response(
      JSON.stringify({
        message: 'Auto-sync completed',
        total: characters.length,
        succeeded: successCount,
        failed: failureCount,
        notifications: notifications.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-sync:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
