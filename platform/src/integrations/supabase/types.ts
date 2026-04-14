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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_activations: {
        Row: {
          activated_by: string
          ai_type: Database["public"]["Enums"]["ai_type_id"]
          client_id: string
          created_at: string
          id: string
          lead_id: string | null
          pool_consumed: boolean
        }
        Insert: {
          activated_by: string
          ai_type: Database["public"]["Enums"]["ai_type_id"]
          client_id: string
          created_at?: string
          id?: string
          lead_id?: string | null
          pool_consumed?: boolean
        }
        Update: {
          activated_by?: string
          ai_type?: Database["public"]["Enums"]["ai_type_id"]
          client_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          pool_consumed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_activations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_activations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_centavos: number | null
          channel: Database["public"]["Enums"]["campaign_channel"]
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          budget_centavos?: number | null
          channel: Database["public"]["Enums"]["campaign_channel"]
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          budget_centavos?: number | null
          channel?: Database["public"]["Enums"]["campaign_channel"]
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns_financial: {
        Row: {
          campaign_id: string | null
          channel: string
          client_id: string
          conversions: number
          created_at: string
          date: string
          id: string
          leads: number
          name: string
          revenue_attributed_centavos: number
          spend_centavos: number
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          client_id: string
          conversions?: number
          created_at?: string
          date?: string
          id?: string
          leads?: number
          name: string
          revenue_attributed_centavos?: number
          spend_centavos?: number
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          client_id?: string
          conversions?: number
          created_at?: string
          date?: string
          id?: string
          leads?: number
          name?: string
          revenue_attributed_centavos?: number
          spend_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_financial_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_financial_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["plan_id"]
          pools_extra: number
          pools_included: number
          pools_used: number
          slug: string
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          users_limit: number
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["plan_id"]
          pools_extra?: number
          pools_included?: number
          pools_used?: number
          slug: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          users_limit?: number
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["plan_id"]
          pools_extra?: number
          pools_included?: number
          pools_used?: number
          slug?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          users_limit?: number
        }
        Relationships: []
      }
      extra_pools: {
        Row: {
          client_id: string
          id: string
          month_reference: string
          price_centavos: number
          purchase_date: string
          quantity: number
        }
        Insert: {
          client_id: string
          id?: string
          month_reference: string
          price_centavos: number
          purchase_date?: string
          quantity: number
        }
        Update: {
          client_id?: string
          id?: string
          month_reference?: string
          price_centavos?: number
          purchase_date?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "extra_pools_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          annual_goal_centavos: number
          client_id: string
          created_at: string
          id: string
          month_reference: string | null
          monthly_goal_centavos: number
          updated_at: string
        }
        Insert: {
          annual_goal_centavos?: number
          client_id: string
          created_at?: string
          id?: string
          month_reference?: string | null
          monthly_goal_centavos?: number
          updated_at?: string
        }
        Update: {
          annual_goal_centavos?: number
          client_id?: string
          created_at?: string
          id?: string
          month_reference?: string | null
          monthly_goal_centavos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ai_activations: {
        Row: {
          activated_at: string
          activated_by: string
          activated_by_name: string | null
          ai_type: Database["public"]["Enums"]["ai_type_id"]
          client_id: string
          finished_at: string | null
          id: string
          last_interaction: string | null
          lead_id: string
          paused_at: string | null
          pool_consumed: boolean
          status: Database["public"]["Enums"]["ai_activation_status"]
        }
        Insert: {
          activated_at?: string
          activated_by: string
          activated_by_name?: string | null
          ai_type: Database["public"]["Enums"]["ai_type_id"]
          client_id: string
          finished_at?: string | null
          id?: string
          last_interaction?: string | null
          lead_id: string
          paused_at?: string | null
          pool_consumed?: boolean
          status?: Database["public"]["Enums"]["ai_activation_status"]
        }
        Update: {
          activated_at?: string
          activated_by?: string
          activated_by_name?: string | null
          ai_type?: Database["public"]["Enums"]["ai_type_id"]
          client_id?: string
          finished_at?: string | null
          id?: string
          last_interaction?: string | null
          lead_id?: string
          paused_at?: string | null
          pool_consumed?: boolean
          status?: Database["public"]["Enums"]["ai_activation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_activations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_activations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_status: Database["public"]["Enums"]["lead_ai_status"]
          assigned_to: string | null
          client_id: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          score: number | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          value_centavos: number | null
        }
        Insert: {
          ai_status?: Database["public"]["Enums"]["lead_ai_status"]
          assigned_to?: string | null
          client_id: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value_centavos?: number | null
        }
        Update: {
          ai_status?: Database["public"]["Enums"]["lead_ai_status"]
          assigned_to?: string | null
          client_id?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_centavos: number
          client_id: string
          created_at: string
          id: string
          payment_date: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount_centavos: number
          client_id: string
          created_at?: string
          id?: string
          payment_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount_centavos?: number
          client_id?: string
          created_at?: string
          id?: string
          payment_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_transactions: {
        Row: {
          amount: number
          balance_after: number
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["pool_transaction_type"]
        }
        Insert: {
          amount: number
          balance_after?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["pool_transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["pool_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "pool_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          client_id: string
          created_at: string
          details: Json | null
          id: string
          lead_id: string
          score_type: string
          value: number
        }
        Insert: {
          client_id: string
          created_at?: string
          details?: Json | null
          id?: string
          lead_id: string
          score_type?: string
          value?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          lead_id?: string
          score_type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_date: string | null
          client_id: string
          id: string
          monthly_fee_centavos: number
          plan: Database["public"]["Enums"]["plan_id"]
          pools_included: number
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          users_limit: number
        }
        Insert: {
          cancel_date?: string | null
          client_id: string
          id?: string
          monthly_fee_centavos?: number
          plan?: Database["public"]["Enums"]["plan_id"]
          pools_included?: number
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          users_limit?: number
        }
        Update: {
          cancel_date?: string | null
          client_id?: string
          id?: string
          monthly_fee_centavos?: number
          plan?: Database["public"]["Enums"]["plan_id"]
          pools_included?: number
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          users_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          ai_type: Database["public"]["Enums"]["ai_type_id"]
          client_id: string
          created_at: string
          id: string
          last_message_at: string | null
          lead_id: string
          phone: string
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          ai_type?: Database["public"]["Enums"]["ai_type_id"]
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id: string
          phone: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          ai_type?: Database["public"]["Enums"]["ai_type_id"]
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string
          phone?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender?: Database["public"]["Enums"]["message_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_activate_ai: { Args: { _client_id: string }; Returns: boolean }
      consume_pool: {
        Args: { _client_id: string; _description?: string }
        Returns: boolean
      }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      purchase_additional_pools: {
        Args: {
          _client_id: string
          _month_reference: string
          _price_centavos: number
          _quantity: number
        }
        Returns: boolean
      }
      user_belongs_to_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_activation_status: "active" | "paused" | "finished" | "blocked"
      ai_type_id:
        | "commercial"
        | "reactivation"
        | "performance"
        | "upsell"
        | "marketing"
        | "copy"
      app_role:
        | "superadmin"
        | "iara_admin"
        | "gestor"
        | "marketing"
        | "vendedor"
      campaign_channel:
        | "google_ads"
        | "meta_ads"
        | "linkedin"
        | "email"
        | "whatsapp"
        | "organic"
        | "referral"
      campaign_status: "draft" | "active" | "paused" | "finished"
      client_status: "active" | "suspended" | "canceled"
      conversation_status: "open" | "closed" | "archived"
      lead_ai_status: "none" | "active" | "paused" | "finished" | "blocked"
      lead_status:
        | "novo"
        | "qualificado"
        | "proposta"
        | "negociacao"
        | "ganho"
        | "perdido"
        | "reativacao"
      message_sender: "lead" | "ai" | "human"
      payment_status: "paid" | "pending" | "failed"
      payment_type: "subscription" | "extra_pools"
      plan_id: "ESSENCIAL" | "GROWTH" | "PRO"
      pool_transaction_type:
        | "plan_credit"
        | "extra_purchase"
        | "ai_consume"
        | "manual_adjust"
      subscription_status: "active" | "canceled"
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
      ai_activation_status: ["active", "paused", "finished", "blocked"],
      ai_type_id: [
        "commercial",
        "reactivation",
        "performance",
        "upsell",
        "marketing",
        "copy",
      ],
      app_role: ["superadmin", "iara_admin", "gestor", "marketing", "vendedor"],
      campaign_channel: [
        "google_ads",
        "meta_ads",
        "linkedin",
        "email",
        "whatsapp",
        "organic",
        "referral",
      ],
      campaign_status: ["draft", "active", "paused", "finished"],
      client_status: ["active", "suspended", "canceled"],
      conversation_status: ["open", "closed", "archived"],
      lead_ai_status: ["none", "active", "paused", "finished", "blocked"],
      lead_status: [
        "novo",
        "qualificado",
        "proposta",
        "negociacao",
        "ganho",
        "perdido",
        "reativacao",
      ],
      message_sender: ["lead", "ai", "human"],
      payment_status: ["paid", "pending", "failed"],
      payment_type: ["subscription", "extra_pools"],
      plan_id: ["ESSENCIAL", "GROWTH", "PRO"],
      pool_transaction_type: [
        "plan_credit",
        "extra_purchase",
        "ai_consume",
        "manual_adjust",
      ],
      subscription_status: ["active", "canceled"],
    },
  },
} as const
