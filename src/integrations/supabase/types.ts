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
      eve_characters: {
        Row: {
          access_token: string
          character_id: number
          character_name: string
          character_owner_hash: string
          corporation_id: number | null
          corporation_name: string | null
          created_at: string
          expires_at: string
          id: string
          is_main: boolean | null
          refresh_token: string
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          character_id: number
          character_name: string
          character_owner_hash: string
          corporation_id?: number | null
          corporation_name?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_main?: boolean | null
          refresh_token: string
          scopes: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          character_id?: number
          character_name?: string
          character_owner_hash?: string
          corporation_id?: number | null
          corporation_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_main?: boolean | null
          refresh_token?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
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
          created_at: string
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
          timezone: string | null
          updated_at: string
        }
        Insert: {
          alliance_auth_id?: string | null
          alliance_auth_username?: string | null
          created_at?: string
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
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          alliance_auth_id?: string | null
          alliance_auth_username?: string | null
          created_at?: string
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
