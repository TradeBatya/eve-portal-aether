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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled Member Audit sync for all characters...');

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

    // Sync each character
    const results = [];
    for (const character of characters) {
      try {
        console.log(`Syncing character ${character.character_name} (${character.character_id})`);
        
        // Call the update-member-audit function for each character
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
        } else {
          console.log(`Successfully synced character ${character.character_name}`);
          results.push({
            character_id: character.character_id,
            character_name: character.character_name,
            success: true,
            data
          });
        }
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

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Sync completed: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Scheduled sync completed',
        total: characters.length,
        succeeded: successCount,
        failed: failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled sync:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
