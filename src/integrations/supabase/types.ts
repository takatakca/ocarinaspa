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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      customer_credits: {
        Row: {
          created_at: string
          credit_code: string
          credit_type: string
          credit_value_cents: number | null
          credit_value_percent: number
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          expires_at: string
          id: string
          invoice_number: string | null
          status: string
          stripe_invoice_id: string | null
          survey_id: string | null
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          credit_code: string
          credit_type?: string
          credit_value_cents?: number | null
          credit_value_percent?: number
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string
          id?: string
          invoice_number?: string | null
          status?: string
          stripe_invoice_id?: string | null
          survey_id?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          credit_code?: string
          credit_type?: string
          credit_value_cents?: number | null
          credit_value_percent?: number
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string
          id?: string
          invoice_number?: string | null
          status?: string
          stripe_invoice_id?: string | null
          survey_id?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "customer_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_surveys: {
        Row: {
          callback_time: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delay_acceptable: string | null
          id: string
          improvement_comment: string | null
          invoice_number: string | null
          overall_rating: number | null
          price_clear: string | null
          problem_resolved: string | null
          service_question: string | null
          stripe_invoice_id: string | null
          submitted_at: string | null
          technician_professional: string | null
          token: string
          updated_at: string
          wants_callback: boolean
          would_recommend: string | null
        }
        Insert: {
          callback_time?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delay_acceptable?: string | null
          id?: string
          improvement_comment?: string | null
          invoice_number?: string | null
          overall_rating?: number | null
          price_clear?: string | null
          problem_resolved?: string | null
          service_question?: string | null
          stripe_invoice_id?: string | null
          submitted_at?: string | null
          technician_professional?: string | null
          token: string
          updated_at?: string
          wants_callback?: boolean
          would_recommend?: string | null
        }
        Update: {
          callback_time?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delay_acceptable?: string | null
          id?: string
          improvement_comment?: string | null
          invoice_number?: string | null
          overall_rating?: number | null
          price_clear?: string | null
          problem_resolved?: string | null
          service_question?: string | null
          stripe_invoice_id?: string | null
          submitted_at?: string | null
          technician_professional?: string | null
          token?: string
          updated_at?: string
          wants_callback?: boolean
          would_recommend?: string | null
        }
        Relationships: []
      }
      diagnostic_leads: {
        Row: {
          ai_actions: Json | null
          ai_causes: Json | null
          ai_diagnostic: string | null
          ai_recommend_call: boolean | null
          ai_urgency: string | null
          brand: string
          city: string
          consent: boolean
          created_at: string
          email: string
          error_code: string | null
          full_name: string
          heating: string | null
          id: string
          model: string | null
          phone: string
          problem_description: string
          pump_noise: string | null
          pump_works: string | null
          since: string | null
          source_url: string | null
          spa_year: string | null
          status: string
        }
        Insert: {
          ai_actions?: Json | null
          ai_causes?: Json | null
          ai_diagnostic?: string | null
          ai_recommend_call?: boolean | null
          ai_urgency?: string | null
          brand: string
          city: string
          consent?: boolean
          created_at?: string
          email: string
          error_code?: string | null
          full_name: string
          heating?: string | null
          id?: string
          model?: string | null
          phone: string
          problem_description: string
          pump_noise?: string | null
          pump_works?: string | null
          since?: string | null
          source_url?: string | null
          spa_year?: string | null
          status?: string
        }
        Update: {
          ai_actions?: Json | null
          ai_causes?: Json | null
          ai_diagnostic?: string | null
          ai_recommend_call?: boolean | null
          ai_urgency?: string | null
          brand?: string
          city?: string
          consent?: boolean
          created_at?: string
          email?: string
          error_code?: string | null
          full_name?: string
          heating?: string | null
          id?: string
          model?: string | null
          phone?: string
          problem_description?: string
          pump_noise?: string | null
          pump_works?: string | null
          since?: string | null
          source_url?: string | null
          spa_year?: string | null
          status?: string
        }
        Relationships: []
      }
      service_questions: {
        Row: {
          answered_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          internal_note: string | null
          invoice_number: string | null
          question: string
          status: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          internal_note?: string | null
          invoice_number?: string | null
          question: string
          status?: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          internal_note?: string | null
          invoice_number?: string | null
          question?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          postal_code: string | null
          preferred_date: string | null
          problem_description: string | null
          service_type: string
          source_url: string | null
          spa_brand: string | null
          spa_model: string | null
          status: string
          urgency: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          postal_code?: string | null
          preferred_date?: string | null
          problem_description?: string | null
          service_type: string
          source_url?: string | null
          spa_brand?: string | null
          spa_model?: string | null
          status?: string
          urgency?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          postal_code?: string | null
          preferred_date?: string | null
          problem_description?: string | null
          service_type?: string
          source_url?: string | null
          spa_brand?: string | null
          spa_model?: string | null
          status?: string
          urgency?: string | null
        }
        Relationships: []
      }
      stripe_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_rating: number | null
          customer_rating_at: string | null
          description: string | null
          hosted_invoice_url: string | null
          id: string
          interac_received_at: string | null
          internal_note: string | null
          invoice_number: string | null
          invoice_pdf: string | null
          needs_followup: boolean
          paid_at: string | null
          payment_method: string | null
          status: string
          stripe_customer_id: string | null
          stripe_invoice_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_rating?: number | null
          customer_rating_at?: string | null
          description?: string | null
          hosted_invoice_url?: string | null
          id?: string
          interac_received_at?: string | null
          internal_note?: string | null
          invoice_number?: string | null
          invoice_pdf?: string | null
          needs_followup?: boolean
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_rating?: number | null
          customer_rating_at?: string | null
          description?: string | null
          hosted_invoice_url?: string | null
          id?: string
          interac_received_at?: string | null
          internal_note?: string | null
          invoice_number?: string | null
          invoice_pdf?: string | null
          needs_followup?: boolean
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string
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
    },
  },
} as const
