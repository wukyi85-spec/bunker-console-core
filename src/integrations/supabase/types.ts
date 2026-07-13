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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      members: {
        Row: {
          character_id: string | null
          created_at: string
          id: string
          pass_id: string
          password: string
          player_name: string
          updated_at: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          id?: string
          pass_id: string
          password: string
          player_name: string
          updated_at?: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          id?: string
          pass_id?: string
          password?: string
          player_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          display_order: number
          gold_reward: number
          id: string
          metric: string
          mission_type: string
          reward_id: string | null
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          gold_reward?: number
          id: string
          metric: string
          mission_type?: string
          reward_id?: string | null
          target_value: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          gold_reward?: number
          id?: string
          metric?: string
          mission_type?: string
          reward_id?: string | null
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          character_id: string | null
          created_at: string
          customer_name: string
          gold_earned: number
          grand_total: number
          id: string
          items: Json
          member_id: string | null
          mission_number: string
          notes: string | null
          order_items: Json | null
          pass_id: string | null
          payment_method: string
          phone: string
          player_key: string
          player_name: string | null
          product_total: number
          status: string
          total_grams: number
          total_price: number | null
          updated_at: string
          xp_earned: number
        }
        Insert: {
          address: string
          character_id?: string | null
          created_at?: string
          customer_name: string
          gold_earned?: number
          grand_total?: number
          id?: string
          items?: Json
          member_id?: string | null
          mission_number: string
          notes?: string | null
          order_items?: Json | null
          pass_id?: string | null
          payment_method: string
          phone: string
          player_key: string
          player_name?: string | null
          product_total?: number
          status?: string
          total_grams?: number
          total_price?: number | null
          updated_at?: string
          xp_earned?: number
        }
        Update: {
          address?: string
          character_id?: string | null
          created_at?: string
          customer_name?: string
          gold_earned?: number
          grand_total?: number
          id?: string
          items?: Json
          member_id?: string | null
          mission_number?: string
          notes?: string | null
          order_items?: Json | null
          pass_id?: string | null
          payment_method?: string
          phone?: string
          player_key?: string
          player_name?: string | null
          product_total?: number
          status?: string
          total_grams?: number
          total_price?: number | null
          updated_at?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_missions: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          mission_id: string
          player_key: string
          progress: number
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          mission_id: string
          player_key: string
          progress?: number
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          mission_id?: string
          player_key?: string
          progress?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_rewards: {
        Row: {
          claimed_at: string | null
          earned_at: string
          id: string
          player_key: string
          reward_id: string
          source: string | null
        }
        Insert: {
          claimed_at?: string | null
          earned_at?: string
          id?: string
          player_key: string
          reward_id: string
          source?: string | null
        }
        Update: {
          claimed_at?: string | null
          earned_at?: string
          id?: string
          player_key?: string
          reward_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          activity: number
          character_id: string | null
          created_at: string
          current_rank: string
          gold: number
          level: number
          player_key: string
          player_name: string | null
          total_purchase: number
          total_weight: number
          updated_at: string
          xp: number
        }
        Insert: {
          activity?: number
          character_id?: string | null
          created_at?: string
          current_rank?: string
          gold?: number
          level?: number
          player_key: string
          player_name?: string | null
          total_purchase?: number
          total_weight?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          activity?: number
          character_id?: string | null
          created_at?: string
          current_rank?: string
          gold?: number
          level?: number
          player_key?: string
          player_name?: string | null
          total_purchase?: number
          total_weight?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      ranks: {
        Row: {
          accent: string | null
          display_order: number
          id: string
          max_xp: number | null
          min_xp: number
          name: string
          rewards: Json
        }
        Insert: {
          accent?: string | null
          display_order?: number
          id: string
          max_xp?: number | null
          min_xp: number
          name: string
          rewards?: Json
        }
        Update: {
          accent?: string | null
          display_order?: number
          id?: string
          max_xp?: number | null
          min_xp?: number
          name?: string
          rewards?: Json
        }
        Relationships: []
      }
      rewards: {
        Row: {
          active: boolean
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          reward_type: string
        }
        Insert: {
          active?: boolean
          description?: string | null
          display_order?: number
          icon?: string | null
          id: string
          name: string
          reward_type: string
        }
        Update: {
          active?: boolean
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          reward_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
