import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveRequest {
  ids: number[];
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ids, category }: ResolveRequest = await req.json();

    if (!ids || ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No IDs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Resolving ${ids.length} IDs`);

    // Check cache first
    const { data: cachedNames, error: cacheError } = await supabaseClient
      .from('member_audit_universe_names')
      .select('id, name, category')
      .in('id', ids);

    if (cacheError) {
      console.error('Cache error:', cacheError);
    }

    const cachedMap = new Map<number, string>();
    const cachedIds = new Set<number>();
    
    if (cachedNames) {
      for (const item of cachedNames) {
        cachedMap.set(item.id, item.name);
        cachedIds.add(item.id);
      }
    }

    // Find missing IDs
    const missingIds = ids.filter(id => !cachedIds.has(id));
    console.log(`Found ${cachedMap.size} in cache, fetching ${missingIds.length} from ESI`);

    // Fetch missing names from ESI
    if (missingIds.length > 0) {
      try {
        const esiResponse = await fetch('https://esi.evetech.net/latest/universe/names/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(missingIds),
        });

        if (esiResponse.ok) {
          const esiData = await esiResponse.json();
          
          // Cache new names
          const namesToCache = esiData.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            last_updated: new Date().toISOString(),
          }));

          if (namesToCache.length > 0) {
            const { error: insertError } = await supabaseClient
              .from('member_audit_universe_names')
              .upsert(namesToCache, { onConflict: 'id' });

            if (insertError) {
              console.error('Failed to cache names:', insertError);
            }
          }

          // Add to result map
          for (const item of esiData) {
            cachedMap.set(item.id, item.name);
          }
        } else {
          console.error(`ESI error: ${esiResponse.status}`);
        }
      } catch (esiError) {
        console.error('ESI fetch error:', esiError);
      }
    }

    // Build result object
    const result: Record<number, string> = {};
    for (const id of ids) {
      result[id] = cachedMap.get(id) || `Unknown (${id})`;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Universe resolver error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});