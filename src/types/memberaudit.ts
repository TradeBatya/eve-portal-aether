// Member Audit Type Definitions

export interface MemberAuditMetadata {
  id: string;
  character_id: number;
  user_id: string;
  last_full_sync_at: string | null;
  last_update_at: string;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  sync_progress: Record<string, number>;
  sync_errors: string[];
  enabled_modules: Record<string, boolean>;
  total_sp: number;
  unallocated_sp: number;
  total_assets_value: number;
  wallet_balance: number;
  location_id?: number;
  location_name?: string;
  location_type?: string;
  solar_system_id?: number;
  solar_system_name?: string;
  ship_type_id?: number;
  ship_type_name?: string;
  ship_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterSkill {
  id: string;
  character_id: number;
  skill_id: number;
  skill_name: string;
  trained_skill_level: number;
  active_skill_level: number;
  skillpoints_in_skill: number;
  skill_group_id: number | null;
  skill_group_name: string | null;
  rank: number | null;
  last_updated: string;
  created_at: string;
}

export interface SkillQueueItem {
  id: string;
  character_id: number;
  queue_position: number;
  skill_id: number;
  skill_name: string;
  finished_level: number;
  training_start_sp: number | null;
  level_start_sp: number | null;
  level_end_sp: number | null;
  start_date: string | null;
  finish_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationCache {
  id: string;
  location_id: number;
  location_name: string;
  location_type: string | null;
  solar_system_id: number | null;
  solar_system_name: string | null;
  region_id: number | null;
  region_name: string | null;
  last_updated: string;
  created_at: string;
}

export interface WalletJournalEntry {
  id: string;
  character_id: number;
  journal_id: number;
  date: string;
  ref_type: string;
  first_party_id: number | null;
  first_party_name: string | null;
  first_party_type: string | null;
  second_party_id: number | null;
  second_party_name: string | null;
  second_party_type: string | null;
  amount: number;
  balance: number | null;
  tax: number | null;
  reason: string | null;
  description: string | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  character_id: number;
  transaction_id: number;
  date: string;
  type_id: number;
  type_name: string;
  quantity: number;
  unit_price: number;
  client_id: number;
  client_name: string | null;
  location_id: number;
  location_name: string | null;
  is_buy: boolean;
  is_personal: boolean;
  created_at: string;
}

export interface CharacterImplant {
  id: string;
  character_id: number;
  implant_id: number;
  implant_name: string;
  slot: number;
  attributes: Record<string, any> | null;
  last_updated: string;
  created_at: string;
}

export interface JumpClone {
  id: string;
  character_id: number;
  jump_clone_id: number;
  location_id: number;
  location_name: string | null;
  location_type: string | null;
  implants: any[];
  clone_name: string | null;
  last_updated: string;
  created_at: string;
}

export interface CharacterContact {
  id: string;
  character_id: number;
  contact_id: number;
  contact_name: string;
  contact_type: string;
  standing: number;
  is_watched: boolean;
  is_blocked: boolean;
  label_ids: any[];
  last_updated: string;
  created_at: string;
}

export interface CharacterContract {
  id: string;
  character_id: number;
  contract_id: number;
  type: string;
  status: string;
  issuer_id: number;
  issuer_name: string | null;
  assignee_id: number | null;
  assignee_name: string | null;
  acceptor_id: number | null;
  acceptor_name: string | null;
  price: number | null;
  reward: number | null;
  collateral: number | null;
  volume: number | null;
  start_location_id: number | null;
  start_location_name: string | null;
  end_location_id: number | null;
  end_location_name: string | null;
  date_issued: string;
  date_expired: string | null;
  date_accepted: string | null;
  date_completed: string | null;
  title: string | null;
  for_corporation: boolean;
  created_at: string;
}

export interface IndustryJob {
  id: string;
  character_id: number;
  job_id: number;
  activity_id: number;
  activity_name: string;
  status: string;
  blueprint_id: number;
  blueprint_type_id: number;
  blueprint_type_name: string;
  blueprint_location_id: number;
  product_type_id: number | null;
  product_type_name: string | null;
  facility_id: number;
  facility_name: string | null;
  solar_system_id: number | null;
  solar_system_name: string | null;
  runs: number;
  licensed_runs: number | null;
  start_date: string;
  end_date: string;
  pause_date: string | null;
  cost: number | null;
  created_at: string;
}

export interface MailHeader {
  id: string;
  character_id: number;
  mail_id: number;
  from_id: number;
  from_name: string | null;
  subject: string;
  timestamp: string;
  is_read: boolean;
  labels: any[];
  recipients: any[];
  created_at: string;
}

export interface LoyaltyPoints {
  id: string;
  character_id: number;
  corporation_id: number;
  corporation_name: string;
  loyalty_points: number;
  last_updated: string;
  created_at: string;
}

export interface ESILog {
  id: string;
  character_id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number | null;
  error_message: string | null;
  error_details: any | null;
  request_timestamp: string;
  created_at: string;
}

// Module names for type safety
export type MemberAuditModule = 
  | 'skills'
  | 'skillqueue'
  | 'assets'
  | 'wallet'
  | 'contacts'
  | 'implants'
  | 'clones'
  | 'mail'
  | 'contracts'
  | 'industry'
  | 'mining'
  | 'loyalty';

// Sync result interface
export interface SyncResult {
  success: boolean;
  character_id: number;
  results: Record<MemberAuditModule, {
    success: boolean;
    error?: string;
    updated: number;
  }>;
  errors: string[];
}
