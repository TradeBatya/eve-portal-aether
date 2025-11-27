export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description_en: string
          description_ru: string
          icon: string
          id: string
          is_active: boolean | null
          key: string
          name_en: string
          name_ru: string
          points: number
          requirement_count: number
        }
        Insert: {
          category: string
          created_at?: string | null
          description_en: string
          description_ru: string
          icon: string
          id?: string
          is_active?: boolean | null
          key: string
          name_en: string
          name_ru: string
          points?: number
          requirement_count?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description_en?: string
          description_ru?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          key?: string
          name_en?: string
          name_ru?: string
          points?: number
          requirement_count?: number
        }
        Relationships: []
      }
      alliances: {
        Row: {
          created_at: string
          executor_corp_id: number | null
          id: number
          member_count: number | null
          name: string
          ticker: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          executor_corp_id?: number | null
          id: number
          member_count?: number | null
          name: string
          ticker: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          executor_corp_id?: number | null
          id?: number
          member_count?: number | null
          name?: string
          ticker?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_alliances_executor"
            columns: ["executor_corp_id"]
            isOneToOne: false
            referencedRelation: "corporations"
            referencedColumns: ["id"]
          },
        ]
      }
      character_assets: {
        Row: {
          character_id: number
          created_at: string | null
          estimated_value: number | null
          id: string
          is_blueprint_copy: boolean | null
          is_singleton: boolean | null
          item_id: number
          last_updated: string | null
          location_id: number
          location_name: string | null
          location_type: string | null
          parent_item_id: number | null
          quantity: number
          type_id: number
          type_name: string | null
          user_id: string
        }
        Insert: {
          character_id: number
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          is_blueprint_copy?: boolean | null
          is_singleton?: boolean | null
          item_id: number
          last_updated?: string | null
          location_id: number
          location_name?: string | null
          location_type?: string | null
          parent_item_id?: number | null
          quantity?: number
          type_id: number
          type_name?: string | null
          user_id: string
        }
        Update: {
          character_id?: number
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          is_blueprint_copy?: boolean | null
          is_singleton?: boolean | null
          item_id?: number
          last_updated?: string | null
          location_id?: number
          location_name?: string | null
          location_type?: string | null
          parent_item_id?: number | null
          quantity?: number
          type_id?: number
          type_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      corporation_role_mappings: {
        Row: {
          auto_assign: boolean | null
          corporation_id: number
          created_at: string | null
          eve_role_name: string
          id: string
          permissions: Json | null
          system_role_name: string
          updated_at: string | null
        }
        Insert: {
          auto_assign?: boolean | null
          corporation_id: number
          created_at?: string | null
          eve_role_name: string
          id?: string
          permissions?: Json | null
          system_role_name: string
          updated_at?: string | null
        }
        Update: {
          auto_assign?: boolean | null
          corporation_id?: number
          created_at?: string | null
          eve_role_name?: string
          id?: string
          permissions?: Json | null
          system_role_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporation_role_mappings_system_role_name_fkey"
            columns: ["system_role_name"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      corporations: {
        Row: {
          alliance_id: number | null
          ceo_id: number | null
          created_at: string
          id: number
          member_count: number | null
          name: string
          ticker: string
          updated_at: string
        }
        Insert: {
          alliance_id?: number | null
          ceo_id?: number | null
          created_at?: string
          id: number
          member_count?: number | null
          name: string
          ticker: string
          updated_at?: string
        }
        Update: {
          alliance_id?: number | null
          ceo_id?: number | null
          created_at?: string
          id?: number
          member_count?: number | null
          name?: string
          ticker?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_corporations_alliance"
            columns: ["alliance_id"]
            isOneToOne: false
            referencedRelation: "alliances"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_webhooks: {
        Row: {
          channel_name: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          channel_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_type: string
          webhook_url: string
        }
        Update: {
          channel_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
      esi_service_cache: {
        Row: {
          access_count: number | null
          cache_key: string
          character_id: number | null
          created_at: string | null
          data: Json
          endpoint: string
          expires_at: string
          id: number
          last_accessed: string | null
          priority: number | null
          tags: string[] | null
        }
        Insert: {
          access_count?: number | null
          cache_key: string
          character_id?: number | null
          created_at?: string | null
          data: Json
          endpoint: string
          expires_at: string
          id?: number
          last_accessed?: string | null
          priority?: number | null
          tags?: string[] | null
        }
        Update: {
          access_count?: number | null
          cache_key?: string
          character_id?: number | null
          created_at?: string | null
          data?: Json
          endpoint?: string
          expires_at?: string
          id?: number
          last_accessed?: string | null
          priority?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
      esi_service_request_logs: {
        Row: {
          accessed_at: string | null
          cache_hit: boolean | null
          character_id: number | null
          endpoint: string
          error_message: string | null
          from_queue: boolean | null
          id: number
          method: string | null
          request_body: Json | null
          response_body: Json | null
          response_time_ms: number | null
          retry_count: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          cache_hit?: boolean | null
          character_id?: number | null
          endpoint: string
          error_message?: string | null
          from_queue?: boolean | null
          id?: number
          method?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          retry_count?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          cache_hit?: boolean | null
          character_id?: number | null
          endpoint?: string
          error_message?: string | null
          from_queue?: boolean | null
          id?: number
          method?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          retry_count?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      esi_service_tokens: {
        Row: {
          access_token: string
          auto_refresh_enabled: boolean | null
          character_id: number
          created_at: string | null
          expires_at: string
          last_validated_at: string | null
          refresh_token: string
          scopes: string[]
          token_type: string | null
          updated_at: string | null
          validation_failures: number | null
        }
        Insert: {
          access_token: string
          auto_refresh_enabled?: boolean | null
          character_id: number
          created_at?: string | null
          expires_at: string
          last_validated_at?: string | null
          refresh_token: string
          scopes: string[]
          token_type?: string | null
          updated_at?: string | null
          validation_failures?: number | null
        }
        Update: {
          access_token?: string
          auto_refresh_enabled?: boolean | null
          character_id?: number
          created_at?: string | null
          expires_at?: string
          last_validated_at?: string | null
          refresh_token?: string
          scopes?: string[]
          token_type?: string | null
          updated_at?: string | null
          validation_failures?: number | null
        }
        Relationships: []
      }
      esi_service_universe_names: {
        Row: {
          category: string
          created_at: string | null
          expires_at: string
          id: number
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          expires_at: string
          id: number
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          expires_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      eve_characters: {
        Row: {
          access_token: string
          alliance_id: number | null
          alliance_name: string | null
          character_id: number
          character_name: string
          character_owner_hash: string
          corporation_id: number | null
          corporation_name: string | null
          created_at: string
          expires_at: string
          id: string
          is_main: boolean | null
          last_refreshed_at: string | null
          location_system_id: number | null
          location_system_name: string | null
          refresh_token: string
          scopes: string[]
          security_status: number | null
          ship_type_id: number | null
          ship_type_name: string | null
          updated_at: string
          user_id: string
          wallet_balance: number | null
        }
        Insert: {
          access_token: string
          alliance_id?: number | null
          alliance_name?: string | null
          character_id: number
          character_name: string
          character_owner_hash: string
          corporation_id?: number | null
          corporation_name?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_main?: boolean | null
          last_refreshed_at?: string | null
          location_system_id?: number | null
          location_system_name?: string | null
          refresh_token: string
          scopes: string[]
          security_status?: number | null
          ship_type_id?: number | null
          ship_type_name?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number | null
        }
        Update: {
          access_token?: string
          alliance_id?: number | null
          alliance_name?: string | null
          character_id?: number
          character_name?: string
          character_owner_hash?: string
          corporation_id?: number | null
          corporation_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_main?: boolean | null
          last_refreshed_at?: string | null
          location_system_id?: number | null
          location_system_name?: string | null
          refresh_token?: string
          scopes?: string[]
          security_status?: number | null
          ship_type_id?: number | null
          ship_type_name?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      fleet_operations: {
        Row: {
          created_at: string
          created_by: string | null
          current_participants: number | null
          description: string | null
          doctrine: string | null
          duration_minutes: number | null
          fc_name: string
          id: string
          image_url: string | null
          location: string | null
          max_participants: number | null
          objectives: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          start_time: string
          status: Database["public"]["Enums"]["operation_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          doctrine?: string | null
          duration_minutes?: number | null
          fc_name: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          objectives?: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          start_time: string
          status?: Database["public"]["Enums"]["operation_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          doctrine?: string | null
          duration_minutes?: number | null
          fc_name?: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          objectives?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"]
          start_time?: string
          status?: Database["public"]["Enums"]["operation_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      intel_reports: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          expires_at: string | null
          hostile_corps: string[] | null
          hostiles_count: number | null
          id: string
          is_active: boolean
          region_name: string | null
          reported_by: string | null
          ship_types: string[] | null
          system_name: string
          threat_level: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          hostile_corps?: string[] | null
          hostiles_count?: number | null
          id?: string
          is_active?: boolean
          region_name?: string | null
          reported_by?: string | null
          ship_types?: string[] | null
          system_name: string
          threat_level?: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          hostile_corps?: string[] | null
          hostiles_count?: number | null
          id?: string
          is_active?: boolean
          region_name?: string | null
          reported_by?: string | null
          ship_types?: string[] | null
          system_name?: string
          threat_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_audit_assets: {
        Row: {
          character_id: number
          created_at: string | null
          id: string
          is_blueprint_copy: boolean | null
          is_singleton: boolean | null
          item_id: number
          last_updated: string | null
          location_id: number
          location_name: string | null
          location_type: string | null
          quantity: number
          type_id: number
          type_name: string | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          id?: string
          is_blueprint_copy?: boolean | null
          is_singleton?: boolean | null
          item_id: number
          last_updated?: string | null
          location_id: number
          location_name?: string | null
          location_type?: string | null
          quantity?: number
          type_id: number
          type_name?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          id?: string
          is_blueprint_copy?: boolean | null
          is_singleton?: boolean | null
          item_id?: number
          last_updated?: string | null
          location_id?: number
          location_name?: string | null
          location_type?: string | null
          quantity?: number
          type_id?: number
          type_name?: string | null
        }
        Relationships: []
      }
      member_audit_clones: {
        Row: {
          character_id: number
          clone_name: string | null
          created_at: string | null
          id: string
          implants: Json | null
          jump_clone_id: number
          last_updated: string | null
          location_id: number
          location_name: string | null
          location_type: string | null
        }
        Insert: {
          character_id: number
          clone_name?: string | null
          created_at?: string | null
          id?: string
          implants?: Json | null
          jump_clone_id: number
          last_updated?: string | null
          location_id: number
          location_name?: string | null
          location_type?: string | null
        }
        Update: {
          character_id?: number
          clone_name?: string | null
          created_at?: string | null
          id?: string
          implants?: Json | null
          jump_clone_id?: number
          last_updated?: string | null
          location_id?: number
          location_name?: string | null
          location_type?: string | null
        }
        Relationships: []
      }
      member_audit_contacts: {
        Row: {
          character_id: number
          contact_id: number
          contact_name: string
          contact_type: string
          created_at: string | null
          id: string
          is_blocked: boolean | null
          is_watched: boolean | null
          label_ids: Json | null
          last_updated: string | null
          standing: number
        }
        Insert: {
          character_id: number
          contact_id: number
          contact_name: string
          contact_type: string
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          is_watched?: boolean | null
          label_ids?: Json | null
          last_updated?: string | null
          standing: number
        }
        Update: {
          character_id?: number
          contact_id?: number
          contact_name?: string
          contact_type?: string
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          is_watched?: boolean | null
          label_ids?: Json | null
          last_updated?: string | null
          standing?: number
        }
        Relationships: []
      }
      member_audit_contracts: {
        Row: {
          acceptor_id: number | null
          acceptor_name: string | null
          assignee_id: number | null
          assignee_name: string | null
          character_id: number
          collateral: number | null
          contract_id: number
          created_at: string | null
          date_accepted: string | null
          date_completed: string | null
          date_expired: string | null
          date_issued: string
          end_location_id: number | null
          end_location_name: string | null
          for_corporation: boolean | null
          id: string
          issuer_id: number
          issuer_name: string | null
          price: number | null
          reward: number | null
          start_location_id: number | null
          start_location_name: string | null
          status: string
          title: string | null
          type: string
          volume: number | null
        }
        Insert: {
          acceptor_id?: number | null
          acceptor_name?: string | null
          assignee_id?: number | null
          assignee_name?: string | null
          character_id: number
          collateral?: number | null
          contract_id: number
          created_at?: string | null
          date_accepted?: string | null
          date_completed?: string | null
          date_expired?: string | null
          date_issued: string
          end_location_id?: number | null
          end_location_name?: string | null
          for_corporation?: boolean | null
          id?: string
          issuer_id: number
          issuer_name?: string | null
          price?: number | null
          reward?: number | null
          start_location_id?: number | null
          start_location_name?: string | null
          status: string
          title?: string | null
          type: string
          volume?: number | null
        }
        Update: {
          acceptor_id?: number | null
          acceptor_name?: string | null
          assignee_id?: number | null
          assignee_name?: string | null
          character_id?: number
          collateral?: number | null
          contract_id?: number
          created_at?: string | null
          date_accepted?: string | null
          date_completed?: string | null
          date_expired?: string | null
          date_issued?: string
          end_location_id?: number | null
          end_location_name?: string | null
          for_corporation?: boolean | null
          id?: string
          issuer_id?: number
          issuer_name?: string | null
          price?: number | null
          reward?: number | null
          start_location_id?: number | null
          start_location_name?: string | null
          status?: string
          title?: string | null
          type?: string
          volume?: number | null
        }
        Relationships: []
      }
      member_audit_esi_logs: {
        Row: {
          character_id: number
          created_at: string | null
          endpoint: string
          error_details: Json | null
          error_message: string | null
          id: string
          method: string
          request_timestamp: string | null
          response_time_ms: number | null
          status_code: number
        }
        Insert: {
          character_id: number
          created_at?: string | null
          endpoint: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          method?: string
          request_timestamp?: string | null
          response_time_ms?: number | null
          status_code: number
        }
        Update: {
          character_id?: number
          created_at?: string | null
          endpoint?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          method?: string
          request_timestamp?: string | null
          response_time_ms?: number | null
          status_code?: number
        }
        Relationships: []
      }
      member_audit_implants: {
        Row: {
          attributes: Json | null
          character_id: number
          created_at: string | null
          id: string
          implant_id: number
          implant_name: string
          last_updated: string | null
          slot: number
        }
        Insert: {
          attributes?: Json | null
          character_id: number
          created_at?: string | null
          id?: string
          implant_id: number
          implant_name: string
          last_updated?: string | null
          slot: number
        }
        Update: {
          attributes?: Json | null
          character_id?: number
          created_at?: string | null
          id?: string
          implant_id?: number
          implant_name?: string
          last_updated?: string | null
          slot?: number
        }
        Relationships: []
      }
      member_audit_industry_jobs: {
        Row: {
          activity_id: number
          activity_name: string
          blueprint_id: number
          blueprint_location_id: number
          blueprint_type_id: number
          blueprint_type_name: string
          character_id: number
          cost: number | null
          created_at: string | null
          end_date: string
          facility_id: number
          facility_name: string | null
          id: string
          job_id: number
          licensed_runs: number | null
          pause_date: string | null
          product_type_id: number | null
          product_type_name: string | null
          runs: number
          solar_system_id: number | null
          solar_system_name: string | null
          start_date: string
          status: string
        }
        Insert: {
          activity_id: number
          activity_name: string
          blueprint_id: number
          blueprint_location_id: number
          blueprint_type_id: number
          blueprint_type_name: string
          character_id: number
          cost?: number | null
          created_at?: string | null
          end_date: string
          facility_id: number
          facility_name?: string | null
          id?: string
          job_id: number
          licensed_runs?: number | null
          pause_date?: string | null
          product_type_id?: number | null
          product_type_name?: string | null
          runs: number
          solar_system_id?: number | null
          solar_system_name?: string | null
          start_date: string
          status: string
        }
        Update: {
          activity_id?: number
          activity_name?: string
          blueprint_id?: number
          blueprint_location_id?: number
          blueprint_type_id?: number
          blueprint_type_name?: string
          character_id?: number
          cost?: number | null
          created_at?: string | null
          end_date?: string
          facility_id?: number
          facility_name?: string | null
          id?: string
          job_id?: number
          licensed_runs?: number | null
          pause_date?: string | null
          product_type_id?: number | null
          product_type_name?: string | null
          runs?: number
          solar_system_id?: number | null
          solar_system_name?: string | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      member_audit_location_cache: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          location_id: number
          location_name: string
          location_type: string | null
          region_id: number | null
          region_name: string | null
          solar_system_id: number | null
          solar_system_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          location_id: number
          location_name: string
          location_type?: string | null
          region_id?: number | null
          region_name?: string | null
          solar_system_id?: number | null
          solar_system_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          location_id?: number
          location_name?: string
          location_type?: string | null
          region_id?: number | null
          region_name?: string | null
          solar_system_id?: number | null
          solar_system_name?: string | null
        }
        Relationships: []
      }
      member_audit_loyalty_points: {
        Row: {
          character_id: number
          corporation_id: number
          corporation_name: string
          created_at: string | null
          id: string
          last_updated: string | null
          loyalty_points: number
        }
        Insert: {
          character_id: number
          corporation_id: number
          corporation_name: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          loyalty_points: number
        }
        Update: {
          character_id?: number
          corporation_id?: number
          corporation_name?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          loyalty_points?: number
        }
        Relationships: []
      }
      member_audit_mail_headers: {
        Row: {
          character_id: number
          created_at: string | null
          from_id: number
          from_name: string | null
          id: string
          is_read: boolean | null
          labels: Json | null
          mail_id: number
          recipients: Json | null
          subject: string
          timestamp: string
        }
        Insert: {
          character_id: number
          created_at?: string | null
          from_id: number
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          labels?: Json | null
          mail_id: number
          recipients?: Json | null
          subject: string
          timestamp: string
        }
        Update: {
          character_id?: number
          created_at?: string | null
          from_id?: number
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          labels?: Json | null
          mail_id?: number
          recipients?: Json | null
          subject?: string
          timestamp?: string
        }
        Relationships: []
      }
      member_audit_metadata: {
        Row: {
          character_id: number
          created_at: string | null
          enabled_modules: Json | null
          id: string
          last_full_sync_at: string | null
          last_update_at: string | null
          location_id: number | null
          location_name: string | null
          location_type: string | null
          security_status: number | null
          ship_name: string | null
          ship_type_id: number | null
          ship_type_name: string | null
          solar_system_id: number | null
          solar_system_name: string | null
          sync_errors: Json | null
          sync_progress: Json | null
          sync_status: string | null
          total_assets_value: number | null
          total_sp: number | null
          unallocated_sp: number | null
          updated_at: string | null
          user_id: string
          wallet_balance: number | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          enabled_modules?: Json | null
          id?: string
          last_full_sync_at?: string | null
          last_update_at?: string | null
          location_id?: number | null
          location_name?: string | null
          location_type?: string | null
          security_status?: number | null
          ship_name?: string | null
          ship_type_id?: number | null
          ship_type_name?: string | null
          solar_system_id?: number | null
          solar_system_name?: string | null
          sync_errors?: Json | null
          sync_progress?: Json | null
          sync_status?: string | null
          total_assets_value?: number | null
          total_sp?: number | null
          unallocated_sp?: number | null
          updated_at?: string | null
          user_id: string
          wallet_balance?: number | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          enabled_modules?: Json | null
          id?: string
          last_full_sync_at?: string | null
          last_update_at?: string | null
          location_id?: number | null
          location_name?: string | null
          location_type?: string | null
          security_status?: number | null
          ship_name?: string | null
          ship_type_id?: number | null
          ship_type_name?: string | null
          solar_system_id?: number | null
          solar_system_name?: string | null
          sync_errors?: Json | null
          sync_progress?: Json | null
          sync_status?: string | null
          total_assets_value?: number | null
          total_sp?: number | null
          unallocated_sp?: number | null
          updated_at?: string | null
          user_id?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      member_audit_skillqueue: {
        Row: {
          character_id: number
          created_at: string | null
          finish_date: string | null
          finished_level: number
          id: string
          level_end_sp: number | null
          level_start_sp: number | null
          queue_position: number
          skill_id: number
          skill_name: string
          start_date: string | null
          training_start_sp: number | null
          updated_at: string | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          finish_date?: string | null
          finished_level: number
          id?: string
          level_end_sp?: number | null
          level_start_sp?: number | null
          queue_position: number
          skill_id: number
          skill_name: string
          start_date?: string | null
          training_start_sp?: number | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          finish_date?: string | null
          finished_level?: number
          id?: string
          level_end_sp?: number | null
          level_start_sp?: number | null
          queue_position?: number
          skill_id?: number
          skill_name?: string
          start_date?: string | null
          training_start_sp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      member_audit_skills: {
        Row: {
          active_skill_level: number
          character_id: number
          created_at: string | null
          id: string
          last_updated: string | null
          rank: number | null
          skill_group_id: number | null
          skill_group_name: string | null
          skill_id: number
          skill_name: string
          skillpoints_in_skill: number
          trained_skill_level: number
        }
        Insert: {
          active_skill_level: number
          character_id: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          rank?: number | null
          skill_group_id?: number | null
          skill_group_name?: string | null
          skill_id: number
          skill_name: string
          skillpoints_in_skill: number
          trained_skill_level: number
        }
        Update: {
          active_skill_level?: number
          character_id?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          rank?: number | null
          skill_group_id?: number | null
          skill_group_name?: string | null
          skill_id?: number
          skill_name?: string
          skillpoints_in_skill?: number
          trained_skill_level?: number
        }
        Relationships: []
      }
      member_audit_universe_names: {
        Row: {
          category: string
          id: number
          last_updated: string | null
          name: string
        }
        Insert: {
          category: string
          id: number
          last_updated?: string | null
          name: string
        }
        Update: {
          category?: string
          id?: number
          last_updated?: string | null
          name?: string
        }
        Relationships: []
      }
      member_audit_wallet_journal: {
        Row: {
          amount: number
          balance: number | null
          character_id: number
          created_at: string | null
          date: string
          description: string | null
          first_party_id: number | null
          first_party_name: string | null
          first_party_type: string | null
          id: string
          journal_id: number
          reason: string | null
          ref_type: string
          second_party_id: number | null
          second_party_name: string | null
          second_party_type: string | null
          tax: number | null
        }
        Insert: {
          amount: number
          balance?: number | null
          character_id: number
          created_at?: string | null
          date: string
          description?: string | null
          first_party_id?: number | null
          first_party_name?: string | null
          first_party_type?: string | null
          id?: string
          journal_id: number
          reason?: string | null
          ref_type: string
          second_party_id?: number | null
          second_party_name?: string | null
          second_party_type?: string | null
          tax?: number | null
        }
        Update: {
          amount?: number
          balance?: number | null
          character_id?: number
          created_at?: string | null
          date?: string
          description?: string | null
          first_party_id?: number | null
          first_party_name?: string | null
          first_party_type?: string | null
          id?: string
          journal_id?: number
          reason?: string | null
          ref_type?: string
          second_party_id?: number | null
          second_party_name?: string | null
          second_party_type?: string | null
          tax?: number | null
        }
        Relationships: []
      }
      member_audit_wallet_transactions: {
        Row: {
          character_id: number
          client_id: number
          client_name: string | null
          created_at: string | null
          date: string
          id: string
          is_buy: boolean
          is_personal: boolean
          location_id: number
          location_name: string | null
          quantity: number
          transaction_id: number
          type_id: number
          type_name: string
          unit_price: number
        }
        Insert: {
          character_id: number
          client_id: number
          client_name?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_buy: boolean
          is_personal: boolean
          location_id: number
          location_name?: string | null
          quantity: number
          transaction_id: number
          type_id: number
          type_name: string
          unit_price: number
        }
        Update: {
          character_id?: number
          client_id?: number
          client_name?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_buy?: boolean
          is_personal?: boolean
          location_id?: number
          location_name?: string | null
          quantity?: number
          transaction_id?: number
          type_id?: number
          type_name?: string
          unit_price?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          category_en: string
          category_ru: string
          created_at: string
          date: string
          description_en: string
          description_ru: string
          id: string
          image_url: string
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          category_en: string
          category_ru: string
          created_at?: string
          date?: string
          description_en: string
          description_ru: string
          id?: string
          image_url: string
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          category_en?: string
          category_ru?: string
          created_at?: string
          date?: string
          description_en?: string
          description_ru?: string
          id?: string
          image_url?: string
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: []
      }
      operation_signups: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          operation_id: string
          role: string | null
          ship_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          operation_id: string
          role?: string | null
          ship_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          operation_id?: string
          role?: string | null
          ship_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_signups_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "fleet_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      ping_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          priority: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          priority?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          priority?: string
          title?: string
        }
        Relationships: []
      }
      plugins: {
        Row: {
          author: string | null
          created_at: string
          description: string | null
          enabled: boolean | null
          id: string
          is_system: boolean | null
          metadata: Json | null
          name: string
          plugin_id: string
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          plugin_id: string
          updated_at?: string
          version: string
        }
        Update: {
          author?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          plugin_id?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alliance_auth_id: string | null
          alliance_auth_username: string | null
          avatar_url: string | null
          created_at: string
          dashboard_layout: Json | null
          discord_access_token: string | null
          discord_avatar: string | null
          discord_connected_at: string | null
          discord_email: string | null
          discord_id: string | null
          discord_refresh_token: string | null
          discord_user_id: string | null
          discord_username: string | null
          display_name: string | null
          id: string
          last_activity: string | null
          notification_settings: Json | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          alliance_auth_id?: string | null
          alliance_auth_username?: string | null
          avatar_url?: string | null
          created_at?: string
          dashboard_layout?: Json | null
          discord_access_token?: string | null
          discord_avatar?: string | null
          discord_connected_at?: string | null
          discord_email?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_user_id?: string | null
          discord_username?: string | null
          display_name?: string | null
          id: string
          last_activity?: string | null
          notification_settings?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          alliance_auth_id?: string | null
          alliance_auth_username?: string | null
          avatar_url?: string | null
          created_at?: string
          dashboard_layout?: Json | null
          discord_access_token?: string | null
          discord_avatar?: string | null
          discord_connected_at?: string | null
          discord_email?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_user_id?: string | null
          discord_username?: string | null
          display_name?: string | null
          id?: string
          last_activity?: string | null
          notification_settings?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_assignment_logs: {
        Row: {
          action: string
          created_at: string | null
          granted_by: string | null
          id: string
          metadata: Json | null
          reason: string | null
          role_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          role_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          role_name?: string
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          hierarchy_level: number
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          hierarchy_level?: number
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          hierarchy_level?: number
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plugins: {
        Row: {
          enabled: boolean | null
          id: string
          installed_at: string
          plugin_id: string
          settings: Json | null
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          installed_at?: string
          plugin_id: string
          settings?: Json | null
          user_id: string
        }
        Update: {
          enabled?: boolean | null
          id?: string
          installed_at?: string
          plugin_id?: string
          settings?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plugins_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role_id: string | null
          role_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id?: string | null
          role_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id?: string | null
          role_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_esi_cache: { Args: never; Returns: undefined }
      cleanup_esi_cache_old: { Args: never; Returns: undefined }
      get_user_permissions: { Args: { user_uuid: string }; Returns: Json }
      has_permission: {
        Args: { permission_name: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_level: {
        Args: { min_level: number; user_uuid: string }
        Returns: boolean
      }
      increment_token_failures: {
        Args: { char_id: number }
        Returns: undefined
      }
      update_achievement_progress: {
        Args: {
          p_achievement_key: string
          p_increment?: number
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      operation_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      operation_type:
        | "pvp"
        | "pve"
        | "mining"
        | "training"
        | "logistics"
        | "defense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      operation_status: ["scheduled", "ongoing", "completed", "cancelled"],
      operation_type: [
        "pvp",
        "pve",
        "mining",
        "training",
        "logistics",
        "defense",
      ],
    },
  },
} as const
