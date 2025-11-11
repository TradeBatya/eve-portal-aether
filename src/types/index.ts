// User types
export interface User {
  id: string;
  email?: string;
  display_name?: string;
}

// Profile types
export interface Profile {
  id: string;
  display_name?: string;
  discord_username?: string;
  discord_id?: string;
  timezone?: string;
}

// Role types
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  hierarchy_level: number;
}

// Operation types
export interface Operation {
  id: string;
  title: string;
  description?: string;
  operation_type: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  start_time: string;
  duration_minutes?: number;
  fc_name: string;
  location?: string;
  doctrine?: string;
  objectives?: string;
  max_participants?: number;
  current_participants?: number;
}

// Intel types
export interface IntelReport {
  id: string;
  system_name: string;
  region_name?: string;
  activity_type: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  hostiles_count?: number;
  ship_types?: string[];
  hostile_corps?: string[];
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

// News types
export interface News {
  id: string;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  category_en: string;
  category_ru: string;
  image_url: string;
  date: string;
}

// Corporation types
export interface Corporation {
  id: number;
  name: string;
  ticker: string;
  alliance_id?: number;
  member_count?: number;
  ceo_id?: number;
  created_at: string;
  updated_at: string;
}

// Alliance types
export interface Alliance {
  id: number;
  name: string;
  ticker: string;
  executor_corp_id?: number;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

// Plugin types
export interface Plugin {
  id: string;
  plugin_id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  enabled: boolean;
  is_system: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// User Plugin types
export interface UserPlugin {
  id: string;
  user_id: string;
  plugin_id: string;
  enabled: boolean;
  settings: Record<string, any>;
  installed_at: string;
  plugins?: Plugin;  // For joined queries
}
