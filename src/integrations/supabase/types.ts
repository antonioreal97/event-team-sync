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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          daily_payment: number
          date: string
          id: string
          notes: string | null
          payment_confirmed: boolean | null
          status: string | null
          team_allocation_id: string | null
          updated_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          daily_payment: number
          date: string
          id?: string
          notes?: string | null
          payment_confirmed?: boolean | null
          status?: string | null
          team_allocation_id?: string | null
          updated_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          daily_payment?: number
          date?: string
          id?: string
          notes?: string | null
          payment_confirmed?: boolean | null
          status?: string | null
          team_allocation_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_team_allocation_id_fkey"
            columns: ["team_allocation_id"]
            isOneToOne: false
            referencedRelation: "team_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_allocations: {
        Row: {
          created_at: string | null
          end_date: string
          equipment_id: string | null
          event_id: string | null
          id: string
          notes: string | null
          quantity: number
          start_date: string
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          equipment_id?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          quantity: number
          start_date: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          equipment_id?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          start_date?: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_allocations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      equipments: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string | null
          daily_rate: number | null
          description: string | null
          hourly_rate: number | null
          id: string
          last_maintenance: string | null
          location: string | null
          name: string
          total_quantity: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          name: string
          total_quantity: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          name?: string
          total_quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      event_interests: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_team_b: boolean | null
          budget: number | null
          created_at: string | null
          created_by: string | null
          daily_rate_team_a: number
          daily_rate_team_b: number
          description: string | null
          end_date: string
          estimated_duration: number | null
          event_type: string | null
          id: string
          is_multi_day: boolean | null
          location: string | null
          notes: string | null
          requirements: string[] | null
          start_date: string
          status: string | null
          team_priority: string | null
          title: string
          total_days: number | null
          updated_at: string | null
          working_days: string[] | null
        }
        Insert: {
          allow_team_b?: boolean | null
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          daily_rate_team_a: number
          daily_rate_team_b: number
          description?: string | null
          end_date: string
          estimated_duration?: number | null
          event_type?: string | null
          id?: string
          is_multi_day?: boolean | null
          location?: string | null
          notes?: string | null
          requirements?: string[] | null
          start_date: string
          status?: string | null
          team_priority?: string | null
          title: string
          total_days?: number | null
          updated_at?: string | null
          working_days?: string[] | null
        }
        Update: {
          allow_team_b?: boolean | null
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          daily_rate_team_a?: number
          daily_rate_team_b?: number
          description?: string | null
          end_date?: string
          estimated_duration?: number | null
          event_type?: string | null
          id?: string
          is_multi_day?: boolean | null
          location?: string | null
          notes?: string | null
          requirements?: string[] | null
          start_date?: string
          status?: string | null
          team_priority?: string | null
          title?: string
          total_days?: number | null
          updated_at?: string | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string | null
          status: string | null
          team_type: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invite_token: string
          invited_by?: string | null
          status?: string | null
          team_type?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string | null
          status?: string | null
          team_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_profiles: {
        Row: {
          address: string | null
          audio_visual_roles: string[] | null
          average_rating: number | null
          bio: string | null
          certifications: string[] | null
          city: string | null
          cpf: string | null
          created_at: string | null
          daily_rate: number | null
          equipment: string[] | null
          experience_level: string | null
          hourly_rate: number | null
          id: string
          instagram: string | null
          languages: string[] | null
          linkedin: string | null
          phone: string | null
          portfolio: string | null
          previous_experience: string | null
          state: string | null
          team_type: string | null
          total_earnings: number | null
          total_events_attended: number | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          audio_visual_roles?: string[] | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          daily_rate?: number | null
          equipment?: string[] | null
          experience_level?: string | null
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          languages?: string[] | null
          linkedin?: string | null
          phone?: string | null
          portfolio?: string | null
          previous_experience?: string | null
          state?: string | null
          team_type?: string | null
          total_earnings?: number | null
          total_events_attended?: number | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          audio_visual_roles?: string[] | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          daily_rate?: number | null
          equipment?: string[] | null
          experience_level?: string | null
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          languages?: string[] | null
          linkedin?: string | null
          phone?: string | null
          portfolio?: string | null
          previous_experience?: string | null
          state?: string | null
          team_type?: string | null
          total_earnings?: number | null
          total_events_attended?: number | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          related_event_id: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          related_event_id?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          related_event_id?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_type: string | null
          status: string | null
          team_allocation_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_type?: string | null
          status?: string | null
          team_allocation_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string | null
          status?: string | null
          team_allocation_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_team_allocation_id_fkey"
            columns: ["team_allocation_id"]
            isOneToOne: false
            referencedRelation: "team_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_allocations: {
        Row: {
          assigned_at: string | null
          assigned_role: string
          attended: boolean | null
          cancellation_deadline: string | null
          confirmation_deadline: string | null
          confirmed_at: string | null
          created_at: string | null
          daily_rate: number
          event_id: string | null
          id: string
          notes: string | null
          status: string | null
          total_days: number
          total_hours: number | null
          total_payment: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_role: string
          attended?: boolean | null
          cancellation_deadline?: string | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          daily_rate: number
          event_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          total_days: number
          total_hours?: number | null
          total_payment: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_role?: string
          attended?: boolean | null
          cancellation_deadline?: string | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          daily_rate?: number
          event_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          total_days?: number
          total_hours?: number | null
          total_payment?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_allocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          password_hash: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          password_hash: string
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string
          role?: string
          updated_at?: string | null
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
