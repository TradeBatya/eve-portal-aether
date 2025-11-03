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
      profiles: {
        Row: {
          alliance_auth_id: string | null
          alliance_auth_username: string | null
          created_at: string
          discord_id: string | null
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
          discord_id?: string | null
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
          discord_id?: string | null
          discord_username?: string | null
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
