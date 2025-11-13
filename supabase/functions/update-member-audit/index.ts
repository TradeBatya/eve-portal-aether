import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  character_id: number;
  modules?: string[];
}

interface ESIResponse {
  data: any;
  error?: string;
  status: number;
  responseTime: number;
}

// ESI Helper - fetch with logging
async function fetchESI(
  endpoint: string,
  accessToken: string,
  characterId: number,
  supabase: any
): Promise<ESIResponse> {
  const startTime = Date.now();
  const url = `https://esi.evetech.net/latest${endpoint}`;
  
  try {
    console.log(`[ESI] Fetching: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    // Log request
    await supabase.from('member_audit_esi_logs').insert({
      character_id: characterId,
      endpoint,
      method: 'GET',
      status_code: response.status,
      response_time_ms: responseTime,
      error_message: response.ok ? null : data.error || 'Unknown error',
      error_details: response.ok ? null : data,
    });

    if (!response.ok) {
      console.error(`[ESI] Error ${response.status}: ${endpoint}`, data);
      return {
        data: null,
        error: data.error || 'ESI request failed',
        status: response.status,
        responseTime,
      };
    }

    console.log(`[ESI] Success: ${endpoint} (${responseTime}ms)`);
    return { data, error: undefined, status: response.status, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ESI] Exception: ${endpoint}`, error);
    
    await supabase.from('member_audit_esi_logs').insert({
      character_id: characterId,
      endpoint,
      method: 'GET',
      status_code: 0,
      response_time_ms: responseTime,
      error_message: errorMessage,
      error_details: { exception: String(error) },
    });

    return {
      data: null,
      error: errorMessage,
      status: 0,
      responseTime,
    };
  }
}

// Helper to resolve type IDs to names using /universe/types/
async function resolveTypeNames(typeIds: number[]): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  
  if (typeIds.length === 0) return names;

  // Batch fetch type information
  const batchSize = 100;
  for (let i = 0; i < typeIds.length; i += batchSize) {
    const batch = typeIds.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (typeId) => {
        try {
          const response = await fetch(`https://esi.evetech.net/latest/universe/types/${typeId}/`);
          if (response.ok) {
            const data = await response.json();
            names.set(typeId, data.name);
          }
        } catch (error) {
          console.error(`[ESI] Failed to resolve type ${typeId}:`, error);
        }
      })
    );
  }

  return names;
}

// Helper to resolve entity IDs to names using /universe/names/
async function resolveEntityNames(entityIds: number[]): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  
  if (entityIds.length === 0) return names;

  try {
    const response = await fetch('https://esi.evetech.net/latest/universe/names/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entityIds),
    });

    if (response.ok) {
      const data = await response.json();
      data.forEach((item: any) => {
        names.set(item.id, item.name);
      });
    }
  } catch (error) {
    console.error('[ESI] Failed to resolve entity names:', error);
  }

  return names;
}

// Обновление токена
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get('EVE_CLIENT_ID');
  const clientSecret = Deno.env.get('EVE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('[Token] Missing EVE_CLIENT_ID or EVE_CLIENT_SECRET');
    return null;
  }

  try {
    const auth = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[Token] Refresh failed:', await response.text());
      return null;
    }

    const data = await response.json();
    console.log('[Token] Successfully refreshed');
    return data.access_token;
  } catch (error) {
    console.error('[Token] Refresh exception:', error);
    return null;
  }
}

// MODULE: Skills
async function updateSkills(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Skills] Starting update...');
  
  // Fetch skills
  const skillsRes = await fetchESI(
    `/characters/${characterId}/skills/`,
    accessToken,
    characterId,
    supabase
  );

  if (skillsRes.error || !skillsRes.data) {
    return { success: false, error: skillsRes.error, updated: 0 };
  }

  const skills = skillsRes.data.skills || [];
  
  // Resolve skill type IDs to names
  const skillIds = skills.map((s: any) => s.skill_id);
  const skillNames = await resolveTypeNames(skillIds);
  
  let updated = 0;

  // Upsert skills with resolved names
  for (const skill of skills) {
    const { error } = await supabase.from('member_audit_skills').upsert({
      character_id: characterId,
      skill_id: skill.skill_id,
      skill_name: skillNames.get(skill.skill_id) || `Skill ${skill.skill_id}`,
      trained_skill_level: skill.trained_skill_level,
      active_skill_level: skill.active_skill_level,
      skillpoints_in_skill: skill.skillpoints_in_skill,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'character_id,skill_id',
    });

    if (!error) updated++;
  }

  // Update metadata
  await supabase.from('member_audit_metadata').upsert({
    character_id: characterId,
    total_sp: skillsRes.data.total_sp || 0,
    unallocated_sp: skillsRes.data.unallocated_sp || 0,
  }, {
    onConflict: 'character_id',
  });

  console.log(`[Module:Skills] Updated ${updated} skills`);
  return { success: true, updated };
}

// MODULE: Skillqueue
async function updateSkillqueue(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Skillqueue] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/skillqueue/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  const queue = res.data;
  
  // Resolve skill names
  const skillIds = queue.map((item: any) => item.skill_id);
  const skillNames = await resolveTypeNames(skillIds);

  // Delete old queue
  await supabase.from('member_audit_skillqueue')
    .delete()
    .eq('character_id', characterId);

  let updated = 0;

  for (const item of queue) {
    const { error } = await supabase.from('member_audit_skillqueue').insert({
      character_id: characterId,
      queue_position: item.queue_position,
      skill_id: item.skill_id,
      skill_name: skillNames.get(item.skill_id) || `Skill ${item.skill_id}`,
      finished_level: item.finished_level,
      training_start_sp: item.training_start_sp,
      level_start_sp: item.level_start_sp,
      level_end_sp: item.level_end_sp,
      start_date: item.start_date,
      finish_date: item.finish_date,
    });

    if (!error) updated++;
  }

  console.log(`[Module:Skillqueue] Updated ${updated} items`);
  return { success: true, updated };
}

// MODULE: Wallet
async function updateWallet(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Wallet] Starting update...');
  
  // Get wallet balance
  const balanceRes = await fetchESI(
    `/characters/${characterId}/wallet/`,
    accessToken,
    characterId,
    supabase
  );

  if (!balanceRes.error && balanceRes.data) {
    await supabase.from('member_audit_metadata').upsert({
      character_id: characterId,
      wallet_balance: balanceRes.data,
    }, {
      onConflict: 'character_id',
    });
  }

  // Get wallet journal (last 30 days)
  const journalRes = await fetchESI(
    `/characters/${characterId}/wallet/journal/`,
    accessToken,
    characterId,
    supabase
  );

  let journalUpdated = 0;
  if (!journalRes.error && journalRes.data) {
    for (const entry of journalRes.data) {
      const { error } = await supabase.from('member_audit_wallet_journal').upsert({
        character_id: characterId,
        journal_id: entry.id,
        date: entry.date,
        ref_type: entry.ref_type,
        first_party_id: entry.first_party_id,
        first_party_name: entry.first_party_name,
        first_party_type: entry.first_party_type,
        second_party_id: entry.second_party_id,
        second_party_name: entry.second_party_name,
        second_party_type: entry.second_party_type,
        amount: entry.amount,
        balance: entry.balance,
        tax: entry.tax,
        reason: entry.reason,
        description: entry.description,
      }, {
        onConflict: 'journal_id',
      });

      if (!error) journalUpdated++;
    }
  }

  // Get wallet transactions
  const transactionsRes = await fetchESI(
    `/characters/${characterId}/wallet/transactions/`,
    accessToken,
    characterId,
    supabase
  );

  let transactionsUpdated = 0;
  if (!transactionsRes.error && transactionsRes.data) {
    // Resolve type names
    const typeIds = [...new Set(transactionsRes.data.map((tx: any) => tx.type_id))] as number[];
    const typeNames = await resolveTypeNames(typeIds);
    
    for (const tx of transactionsRes.data) {
      const { error } = await supabase.from('member_audit_wallet_transactions').upsert({
        character_id: characterId,
        transaction_id: tx.transaction_id,
        date: tx.date,
        type_id: tx.type_id,
        type_name: typeNames.get(tx.type_id) || `Item ${tx.type_id}`,
        quantity: tx.quantity,
        unit_price: tx.unit_price,
        client_id: tx.client_id,
        client_name: tx.client_name,
        location_id: tx.location_id,
        location_name: tx.location_name,
        is_buy: tx.is_buy,
        is_personal: tx.is_personal,
      }, {
        onConflict: 'transaction_id',
      });

      if (!error) transactionsUpdated++;
    }
  }

  console.log(`[Module:Wallet] Journal: ${journalUpdated}, Transactions: ${transactionsUpdated}`);
  return { success: true, updated: journalUpdated + transactionsUpdated };
}

// MODULE: Implants
async function updateImplants(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Implants] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/implants/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  // Resolve implant names
  const implantNames = await resolveTypeNames(res.data);

  // Delete old implants
  await supabase.from('member_audit_implants')
    .delete()
    .eq('character_id', characterId);

  let updated = 0;
  for (let i = 0; i < res.data.length; i++) {
    const implantId = res.data[i];
    const { error } = await supabase.from('member_audit_implants').insert({
      character_id: characterId,
      implant_id: implantId,
      implant_name: implantNames.get(implantId) || `Implant ${implantId}`,
      slot: i + 1,
    });

    if (!error) updated++;
  }

  console.log(`[Module:Implants] Updated ${updated} implants`);
  return { success: true, updated };
}

// MODULE: Clones
async function updateClones(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Clones] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/clones/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  // Delete old clones
  await supabase.from('member_audit_clones')
    .delete()
    .eq('character_id', characterId);

  const jumpClones = res.data.jump_clones || [];
  let updated = 0;

  for (const clone of jumpClones) {
    const { error } = await supabase.from('member_audit_clones').insert({
      character_id: characterId,
      jump_clone_id: clone.jump_clone_id,
      location_id: clone.location_id,
      location_name: clone.location_name,
      location_type: clone.location_type,
      implants: JSON.stringify(clone.implants || []),
      clone_name: clone.name,
    });

    if (!error) updated++;
  }

  console.log(`[Module:Clones] Updated ${updated} clones`);
  return { success: true, updated };
}

// MODULE: Contacts
async function updateContacts(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Contacts] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/contacts/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  // Resolve contact names
  const contactIds = res.data.map((c: any) => c.contact_id);
  const contactNames = await resolveEntityNames(contactIds);

  let updated = 0;
  for (const contact of res.data) {
    const { error } = await supabase.from('member_audit_contacts').upsert({
      character_id: characterId,
      contact_id: contact.contact_id,
      contact_name: contactNames.get(contact.contact_id) || `Contact ${contact.contact_id}`,
      contact_type: contact.contact_type,
      standing: contact.standing,
      is_watched: contact.is_watched || false,
      is_blocked: contact.is_blocked || false,
      label_ids: JSON.stringify(contact.label_ids || []),
    }, {
      onConflict: 'character_id,contact_id',
    });

    if (!error) updated++;
  }

  console.log(`[Module:Contacts] Updated ${updated} contacts`);
  return { success: true, updated };
}

// MODULE: Contracts
async function updateContracts(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Contracts] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/contracts/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  // Resolve issuer names
  const issuerIds = [...new Set(res.data.map((c: any) => c.issuer_id))] as number[];
  const issuerNames = await resolveEntityNames(issuerIds);

  let updated = 0;
  for (const contract of res.data) {
    const { error } = await supabase.from('member_audit_contracts').upsert({
      character_id: characterId,
      contract_id: contract.contract_id,
      type: contract.type,
      status: contract.status,
      issuer_id: contract.issuer_id,
      issuer_name: issuerNames.get(contract.issuer_id) || `Issuer ${contract.issuer_id}`,
      assignee_id: contract.assignee_id,
      acceptor_id: contract.acceptor_id,
      price: contract.price,
      reward: contract.reward,
      collateral: contract.collateral,
      volume: contract.volume,
      start_location_id: contract.start_location_id,
      end_location_id: contract.end_location_id,
      date_issued: contract.date_issued,
      date_expired: contract.date_expired,
      date_accepted: contract.date_accepted,
      date_completed: contract.date_completed,
      title: contract.title,
      for_corporation: contract.for_corporation || false,
    }, {
      onConflict: 'contract_id',
    });

    if (!error) updated++;
  }

  console.log(`[Module:Contracts] Updated ${updated} contracts`);
  return { success: true, updated };
}

// MODULE: Industry
async function updateIndustry(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Industry] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/industry/jobs/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  // Resolve blueprint and product names
  const typeIds = new Set<number>();
  res.data.forEach((job: any) => {
    typeIds.add(job.blueprint_type_id);
    if (job.product_type_id) typeIds.add(job.product_type_id);
  });
  const typeNames = await resolveTypeNames(Array.from(typeIds));

  let updated = 0;
  for (const job of res.data) {
    const { error } = await supabase.from('member_audit_industry_jobs').upsert({
      character_id: characterId,
      job_id: job.job_id,
      activity_id: job.activity_id,
      activity_name: `Activity ${job.activity_id}`,
      status: job.status,
      blueprint_id: job.blueprint_id,
      blueprint_type_id: job.blueprint_type_id,
      blueprint_type_name: typeNames.get(job.blueprint_type_id) || `Blueprint ${job.blueprint_type_id}`,
      blueprint_location_id: job.blueprint_location_id,
      product_type_id: job.product_type_id,
      product_type_name: job.product_type_id ? (typeNames.get(job.product_type_id) || `Product ${job.product_type_id}`) : null,
      facility_id: job.facility_id,
      solar_system_id: job.solar_system_id,
      runs: job.runs,
      licensed_runs: job.licensed_runs,
      start_date: job.start_date,
      end_date: job.end_date,
      pause_date: job.pause_date,
      cost: job.cost,
    }, {
      onConflict: 'job_id',
    });

    if (!error) updated++;
  }

  console.log(`[Module:Industry] Updated ${updated} jobs`);
  return { success: true, updated };
}

// MODULE: Loyalty
async function updateLoyalty(characterId: number, accessToken: string, supabase: any) {
  console.log('[Module:Loyalty] Starting update...');
  
  const res = await fetchESI(
    `/characters/${characterId}/loyalty/points/`,
    accessToken,
    characterId,
    supabase
  );

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  // Resolve corporation names
  const corpIds = res.data.map((lp: any) => lp.corporation_id);
  const corpNames = await resolveEntityNames(corpIds);

  let updated = 0;
  for (const lp of res.data) {
    const { error } = await supabase.from('member_audit_loyalty_points').upsert({
      character_id: characterId,
      corporation_id: lp.corporation_id,
      corporation_name: corpNames.get(lp.corporation_id) || `Corporation ${lp.corporation_id}`,
      loyalty_points: lp.loyalty_points,
    }, {
      onConflict: 'character_id,corporation_id',
    });

    if (!error) updated++;
  }

  console.log(`[Module:Loyalty] Updated ${updated} LP entries`);
  return { success: true, updated };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { character_id, modules = ['skills', 'skillqueue', 'wallet', 'implants', 'clones', 'contacts', 'contracts', 'industry', 'loyalty'] }: UpdateRequest = await req.json();

    console.log(`[Update] Starting sync for character ${character_id}, modules:`, modules);

    // Get character data
    const { data: character, error: charError } = await supabase
      .from('eve_characters')
      .select('*')
      .eq('character_id', character_id)
      .single();

    if (charError || !character) {
      throw new Error('Character not found');
    }

    // Check if token needs refresh
    let accessToken = character.access_token;
    const expiresAt = new Date(character.expires_at);
    
    if (expiresAt < new Date()) {
      console.log('[Update] Token expired, refreshing...');
      accessToken = await refreshAccessToken(character.refresh_token);
      
      if (!accessToken) {
        throw new Error('Failed to refresh access token');
      }

      // Update token in database
      const newExpiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
      await supabase
        .from('eve_characters')
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('character_id', character_id);
    }

    // Initialize or update metadata
    await supabase.from('member_audit_metadata').upsert({
      character_id,
      user_id: character.user_id,
      sync_status: 'syncing',
      last_update_at: new Date().toISOString(),
    }, {
      onConflict: 'character_id',
    });

    // Process modules
    const results: Record<string, any> = {};
    const progress: Record<string, number> = {};
    const errors: string[] = [];

    // Get location data
    let locationData: any = {};
    try {
      const locationResponse: any = await fetchESI(`/characters/${character_id}/location/`, accessToken, character_id, supabase);
      if (locationResponse) {
        locationData = {
          location_id: locationResponse.station_id || locationResponse.structure_id || locationResponse.solar_system_id,
          location_type: locationResponse.station_id ? 'station' : locationResponse.structure_id ? 'structure' : 'solar_system',
          solar_system_id: locationResponse.solar_system_id,
        };

        // Resolve solar system name
        if (locationResponse.solar_system_id) {
          const sysNameResponse = await fetch('https://esi.evetech.net/latest/universe/names/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([locationResponse.solar_system_id]),
          });
          if (sysNameResponse.ok) {
            const sysNames = await sysNameResponse.json();
            if (sysNames.length > 0) {
              locationData.solar_system_name = sysNames[0].name;
            }
          }
        }

        // Resolve location name (skip structures for now)
        if (locationData.location_id && locationData.location_type !== 'structure') {
          const locNameResponse = await fetch('https://esi.evetech.net/latest/universe/names/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([locationData.location_id]),
          });
          if (locNameResponse.ok) {
            const locNames = await locNameResponse.json();
            if (locNames.length > 0) {
              locationData.location_name = locNames[0].name;
            }
          }
        } else if (locationData.location_type === 'structure') {
          locationData.location_name = `Structure ${locationData.location_id}`;
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }

    // Get ship data
    let shipData: any = {};
    try {
      const shipResponse: any = await fetchESI(`/characters/${character_id}/ship/`, accessToken, character_id, supabase);
      if (shipResponse) {
        shipData = {
          ship_type_id: shipResponse.ship_type_id,
          ship_name: shipResponse.ship_name,
        };

        // Resolve ship type name
        if (shipResponse.ship_type_id) {
          const shipTypeResponse = await fetch(`https://esi.evetech.net/latest/universe/types/${shipResponse.ship_type_id}/`);
          if (shipTypeResponse.ok) {
            const shipType = await shipTypeResponse.json();
            shipData.ship_type_name = shipType.name;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching ship:', error);
    }

    const moduleHandlers: Record<string, Function> = {
      skills: updateSkills,
      skillqueue: updateSkillqueue,
      wallet: updateWallet,
      implants: updateImplants,
      clones: updateClones,
      contacts: updateContacts,
      contracts: updateContracts,
      industry: updateIndustry,
      loyalty: updateLoyalty,
    };

    for (const module of modules) {
      const handler = moduleHandlers[module];
      if (!handler) {
        console.warn(`[Update] Unknown module: ${module}`);
        continue;
      }

      try {
        const result = await handler(character_id, accessToken, supabase);
        results[module] = result;
        progress[module] = result.success ? 100 : 0;
        
        if (!result.success) {
          errors.push(`${module}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Update] Error in module ${module}:`, error);
        results[module] = { success: false, error: errorMessage };
        progress[module] = 0;
        errors.push(`${module}: ${errorMessage}`);
      }
    }

    // Update final metadata
    await supabase.from('member_audit_metadata').update({
      sync_status: errors.length > 0 ? 'failed' : 'completed',
      sync_progress: progress,
      sync_errors: errors,
      ...locationData,
      ...shipData,
      last_full_sync_at: new Date().toISOString(),
      last_update_at: new Date().toISOString(),
    }).eq('character_id', character_id);

    console.log(`[Update] Completed sync for character ${character_id}`);

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        character_id,
        results,
        errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Update] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
