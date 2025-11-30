import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  character_id: number;
  modules?: string[];
}

interface ModuleResult {
  success: boolean;
  error?: string;
  updated: number;
}

// Use esi-core-proxy for all ESI requests with caching
async function callEsiProxy(
  endpoint: string,
  characterId: number,
  supabase: any
): Promise<{ data: any; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const response = await fetch(`${supabaseUrl}/functions/v1/esi-core-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        endpoint,
        method: 'GET',
        characterId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.error || 'ESI request failed' };
    }

    const data = await response.json();
    return { data, error: undefined };

  } catch (error: any) {
    console.error(`[ESI] Failed to call ${endpoint}:`, error);
    return { data: null, error: error.message };
  }
}

// Helper to resolve type IDs to names
async function resolveTypeNames(typeIds: number[]): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  
  if (typeIds.length === 0) return names;

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
          console.error(`Failed to resolve type ${typeId}:`, error);
        }
      })
    );
  }

  return names;
}

// Helper to resolve entity IDs to names
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
    console.error('Failed to resolve entity names:', error);
  }

  return names;
}

// MODULE: Skills
async function updateSkills(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Skills] Starting update...');
  
  const skillsRes = await callEsiProxy(`/characters/${characterId}/skills/`, characterId, supabase);

  if (skillsRes.error || !skillsRes.data) {
    console.error('[Module:Skills] ESI request failed:', skillsRes.error);
    return { success: false, error: skillsRes.error, updated: 0 };
  }

  console.log('[Module:Skills] ESI response:', { 
    total_sp: skillsRes.data.total_sp, 
    unallocated_sp: skillsRes.data.unallocated_sp,
    skills_count: skillsRes.data.skills?.length 
  });

  const skills = skillsRes.data.skills || [];
  const skillIds = skills.map((s: any) => s.skill_id);
  const skillNames = await resolveTypeNames(skillIds);
  
  let updated = 0;

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

  // Get user_id for metadata
  const { data: charData } = await supabase
    .from('eve_characters')
    .select('user_id')
    .eq('character_id', characterId)
    .single();

  const totalSp = skillsRes.data.total_sp || 0;
  const unallocatedSp = skillsRes.data.unallocated_sp || 0;

  console.log(`[Module:Skills] Updating metadata: total_sp=${totalSp}, unallocated_sp=${unallocatedSp}`);

  await supabase.from('member_audit_metadata').upsert({
    character_id: characterId,
    user_id: charData?.user_id,
    total_sp: totalSp,
    unallocated_sp: unallocatedSp,
    last_update_at: new Date().toISOString(),
  }, {
    onConflict: 'character_id',
  });

  console.log(`[Module:Skills] Updated ${updated} skills`);
  return { success: true, updated };
}

// MODULE: Skillqueue
async function updateSkillqueue(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Skillqueue] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/skillqueue/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  const queue = res.data;
  const skillIds = queue.map((item: any) => item.skill_id);
  const skillNames = await resolveTypeNames(skillIds);

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
async function updateWallet(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Wallet] Starting update...');
  
  const balanceRes = await callEsiProxy(`/characters/${characterId}/wallet/`, characterId, supabase);

  if (!balanceRes.error && balanceRes.data !== undefined && balanceRes.data !== null) {
    const balance = typeof balanceRes.data === 'number' ? balanceRes.data : 0;
    console.log('[Module:Wallet] Balance response:', balanceRes.data, 'Type:', typeof balanceRes.data, 'Converted:', balance);

    // Get user_id for metadata
    const { data: charData } = await supabase
      .from('eve_characters')
      .select('user_id')
      .eq('character_id', characterId)
      .single();

    await supabase.from('member_audit_metadata').upsert({
      character_id: characterId,
      user_id: charData?.user_id,
      wallet_balance: balance,
      last_update_at: new Date().toISOString(),
    }, {
      onConflict: 'character_id',
    });

    console.log(`[Module:Wallet] Updated wallet_balance to ${balance}`);
  } else {
    console.error('[Module:Wallet] Invalid balance response:', balanceRes);
  }

  const journalRes = await callEsiProxy(`/characters/${characterId}/wallet/journal/`, characterId, supabase);

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

  const transactionsRes = await callEsiProxy(`/characters/${characterId}/wallet/transactions/`, characterId, supabase);

  let transactionsUpdated = 0;
  if (!transactionsRes.error && transactionsRes.data) {
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
async function updateImplants(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Implants] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/implants/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  const implantNames = await resolveTypeNames(res.data);

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
async function updateClones(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Clones] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/clones/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

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
async function updateContacts(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Contacts] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/contacts/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

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
async function updateContracts(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Contracts] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/contracts/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  let updated = 0;
  for (const contract of res.data) {
    const { error } = await supabase.from('member_audit_contracts').upsert({
      character_id: characterId,
      contract_id: contract.contract_id,
      issuer_id: contract.issuer_id,
      type: contract.type,
      status: contract.status,
      title: contract.title,
      for_corporation: contract.for_corporation,
      price: contract.price,
      reward: contract.reward,
      collateral: contract.collateral,
      volume: contract.volume,
      date_issued: contract.date_issued,
      date_expired: contract.date_expired,
      date_accepted: contract.date_accepted,
      date_completed: contract.date_completed,
    }, {
      onConflict: 'contract_id',
    });

    if (!error) updated++;
  }

  console.log(`[Module:Contracts] Updated ${updated} contracts`);
  return { success: true, updated };
}

// MODULE: Industry Jobs
async function updateIndustryJobs(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Industry] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/industry/jobs/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

  const typeIds = [...new Set([
    ...res.data.map((job: any) => job.blueprint_type_id),
    ...res.data.map((job: any) => job.product_type_id).filter((id: any) => id)
  ])] as number[];
  
  const typeNames = await resolveTypeNames(typeIds);

  let updated = 0;
  for (const job of res.data) {
    const { error } = await supabase.from('member_audit_industry_jobs').upsert({
      character_id: characterId,
      job_id: job.job_id,
      activity_id: job.activity_id,
      activity_name: getActivityName(job.activity_id),
      blueprint_id: job.blueprint_id,
      blueprint_type_id: job.blueprint_type_id,
      blueprint_type_name: typeNames.get(job.blueprint_type_id) || `Blueprint ${job.blueprint_type_id}`,
      blueprint_location_id: job.blueprint_location_id,
      product_type_id: job.product_type_id,
      product_type_name: job.product_type_id ? typeNames.get(job.product_type_id) || `Product ${job.product_type_id}` : null,
      facility_id: job.facility_id,
      runs: job.runs,
      licensed_runs: job.licensed_runs,
      start_date: job.start_date,
      end_date: job.end_date,
      pause_date: job.pause_date,
      status: job.status,
      cost: job.cost,
    }, {
      onConflict: 'job_id',
    });

    if (!error) updated++;
  }

  console.log(`[Module:Industry] Updated ${updated} jobs`);
  return { success: true, updated };
}

function getActivityName(activityId: number): string {
  const activities: Record<number, string> = {
    1: 'Manufacturing',
    3: 'Time Efficiency Research',
    4: 'Material Efficiency Research',
    5: 'Copying',
    7: 'Reverse Engineering',
    8: 'Invention',
    9: 'Reactions',
  };
  return activities[activityId] || `Activity ${activityId}`;
}

// MODULE: Assets
async function updateAssets(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Assets] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/assets/`, characterId, supabase);

  if (res.error || !res.data) {
    console.error('[Module:Assets] ESI request failed:', res.error);
    return { success: false, error: res.error, updated: 0 };
  }

  console.log(`[Module:Assets] Fetched ${res.data.length} assets`);

  // Resolve type names
  const typeIds = [...new Set(res.data.map((a: any) => a.type_id))] as number[];
  const typeNames = await resolveTypeNames(typeIds);

  // Delete old assets
  await supabase.from('member_audit_assets')
    .delete()
    .eq('character_id', characterId);

  let updated = 0;
  
  for (const asset of res.data) {
    const quantity = asset.quantity || 1;

    const { error } = await supabase.from('member_audit_assets').insert({
      character_id: characterId,
      item_id: asset.item_id,
      type_id: asset.type_id,
      type_name: typeNames.get(asset.type_id) || `Item ${asset.type_id}`,
      location_id: asset.location_id,
      quantity: quantity,
      is_singleton: asset.is_singleton || false,
      is_blueprint_copy: asset.is_blueprint_copy || false,
    });

    if (!error) updated++;
  }

  console.log(`[Module:Assets] Updated ${updated} assets`);
  return { success: true, updated };
}

// MODULE: Loyalty Points
async function updateLoyaltyPoints(characterId: number, supabase: any): Promise<ModuleResult> {
  console.log('[Module:Loyalty] Starting update...');
  
  const res = await callEsiProxy(`/characters/${characterId}/loyalty/points/`, characterId, supabase);

  if (res.error || !res.data) {
    return { success: false, error: res.error, updated: 0 };
  }

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

  console.log(`[Module:Loyalty] Updated ${updated} loyalty points`);
  return { success: true, updated };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { character_id, modules = ['all'] }: UpdateRequest = await req.json();

    if (!character_id) {
      return new Response(
        JSON.stringify({ error: 'character_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[MemberAudit] Starting sync for character ${character_id}, modules:`, modules);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Phase 4: Check if sync already in progress (Race condition prevention)
    const { data: existingSync } = await supabase
      .from('member_audit_metadata')
      .select('sync_status, last_update_at')
      .eq('character_id', character_id)
      .maybeSingle();

    if (existingSync?.sync_status === 'syncing') {
      // Check if sync is stuck (older than 5 minutes)
      const lastUpdate = new Date(existingSync.last_update_at).getTime();
      const now = Date.now();
      const timeElapsed = now - lastUpdate;
      const SYNC_TIMEOUT = 5 * 60 * 1000; // 5 minutes

      if (timeElapsed < SYNC_TIMEOUT) {
        console.log(`[MemberAudit] Sync already in progress for character ${character_id}, skipping...`);
        return new Response(
          JSON.stringify({ 
            error: 'Sync already in progress',
            message: 'Another sync operation is currently running for this character',
            character_id 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`[MemberAudit] Previous sync stuck for character ${character_id}, continuing...`);
      }
    }

    // Update sync status with lock
    await supabase.from('member_audit_metadata').upsert({
      character_id,
      sync_status: 'syncing',
      sync_progress: { started_at: new Date().toISOString() },
      last_update_at: new Date().toISOString(),
    }, {
      onConflict: 'character_id',
    });

    const results: Record<string, ModuleResult> = {};
    const enabledModules = modules.includes('all') ? [
      'skills', 'skillqueue', 'wallet', 'assets', 'implants', 'clones', 
      'contacts', 'contracts', 'industry', 'loyalty'
    ] : modules;

    // Execute modules sequentially to avoid rate limiting
    for (const module of enabledModules) {
      try {
        switch (module) {
          case 'skills':
            results.skills = await updateSkills(character_id, supabase);
            break;
          case 'skillqueue':
            results.skillqueue = await updateSkillqueue(character_id, supabase);
            break;
          case 'wallet':
            results.wallet = await updateWallet(character_id, supabase);
            break;
          case 'assets':
            results.assets = await updateAssets(character_id, supabase);
            break;
          case 'implants':
            results.implants = await updateImplants(character_id, supabase);
            break;
          case 'clones':
            results.clones = await updateClones(character_id, supabase);
            break;
          case 'contacts':
            results.contacts = await updateContacts(character_id, supabase);
            break;
          case 'contracts':
            results.contracts = await updateContracts(character_id, supabase);
            break;
          case 'industry':
            results.industry = await updateIndustryJobs(character_id, supabase);
            break;
          case 'loyalty':
            results.loyalty = await updateLoyaltyPoints(character_id, supabase);
            break;
        }
      } catch (error: any) {
        console.error(`[MemberAudit] Module ${module} failed:`, error);
        results[module] = { success: false, error: error.message, updated: 0 };
      }
    }

    // Update final status
    const hasErrors = Object.values(results).some(r => !r.success);
    await supabase.from('member_audit_metadata').upsert({
      character_id,
      sync_status: hasErrors ? 'error' : 'completed',
      sync_errors: hasErrors ? Object.entries(results).filter(([_, r]) => !r.success).map(([m, r]) => ({ module: m, error: r.error })) : [],
      last_full_sync_at: new Date().toISOString(),
      last_update_at: new Date().toISOString(),
    }, {
      onConflict: 'character_id',
    });

    console.log(`[MemberAudit] Sync completed for character ${character_id}`);

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        character_id,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MemberAudit] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
