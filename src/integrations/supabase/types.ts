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
      attendance_records: {
        Row: {
          allocation_id: string
          check_in_time: string | null
          check_out_time: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          daily_payment: number
          date: string
          id: string
          notes: string | null
          payment_confirmed: boolean
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          allocation_id: string
          check_in_time?: string | null
          check_out_time?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          daily_payment?: number
          date: string
          id?: string
          notes?: string | null
          payment_confirmed?: boolean
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          allocation_id?: string
          check_in_time?: string | null
          check_out_time?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          daily_payment?: number
          date?: string
          id?: string
          notes?: string | null
          payment_confirmed?: boolean
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "team_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category_id: string | null
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at: string
          daily_rate: number | null
          description: string | null
          hourly_rate: number | null
          id: string
          last_maintenance: string | null
          location: string | null
          name: string
          total_quantity: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          name: string
          total_quantity?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          name?: string
          total_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_items: {
        Row: {
          asset_tag: string
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at: string
          equipment_id: string
          id: string
          last_maintenance: string | null
          location: string | null
          notes: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_item_status"]
          updated_at: string
        }
        Insert: {
          asset_tag: string
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          equipment_id: string
          id?: string
          last_maintenance?: string | null
          location?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_item_status"]
          updated_at?: string
        }
        Update: {
          asset_tag?: string
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          equipment_id?: string
          id?: string
          last_maintenance?: string | null
          location?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_reservations: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          condition_in:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          condition_out:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          created_at: string
          equipment_item_id: string
          event_id: string
          id: string
          notes: string | null
          post_event_status: string | null
          reserved_at: string | null
          reserved_by: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          condition_in?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          condition_out?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          created_at?: string
          equipment_item_id: string
          event_id: string
          id?: string
          notes?: string | null
          post_event_status?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          condition_in?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          condition_out?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          created_at?: string
          equipment_item_id?: string
          event_id?: string
          id?: string
          notes?: string | null
          post_event_status?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_reservations_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["interest_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_backup_levels: boolean
          budget: number | null
          created_at: string
          created_by: string | null
          daily_rate_avancado: number
          daily_rate_iniciante: number
          daily_rate_intermediario: number
          daily_schedule: Json | null
          description: string | null
          end_date: string
          estimated_duration: number | null
          event_agenda: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_multi_day: boolean
          location: string | null
          notes: string | null
          requirements: string[] | null
          setup_requirements: string | null
          special_instructions: string | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          team_priority: Database["public"]["Enums"]["team_priority"]
          technical_specifications: string | null
          title: string
          total_days: number
          updated_at: string
          working_days: string[] | null
        }
        Insert: {
          allow_backup_levels?: boolean
          budget?: number | null
          created_at?: string
          created_by?: string | null
          daily_rate_avancado?: number
          daily_rate_iniciante?: number
          daily_rate_intermediario?: number
          daily_schedule?: Json | null
          description?: string | null
          end_date: string
          estimated_duration?: number | null
          event_agenda?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_multi_day?: boolean
          location?: string | null
          notes?: string | null
          requirements?: string[] | null
          setup_requirements?: string | null
          special_instructions?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          team_priority?: Database["public"]["Enums"]["team_priority"]
          technical_specifications?: string | null
          title: string
          total_days?: number
          updated_at?: string
          working_days?: string[] | null
        }
        Update: {
          allow_backup_levels?: boolean
          budget?: number | null
          created_at?: string
          created_by?: string | null
          daily_rate_avancado?: number
          daily_rate_iniciante?: number
          daily_rate_intermediario?: number
          daily_schedule?: Json | null
          description?: string | null
          end_date?: string
          estimated_duration?: number | null
          event_agenda?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_multi_day?: boolean
          location?: string | null
          notes?: string | null
          requirements?: string[] | null
          setup_requirements?: string | null
          special_instructions?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          team_priority?: Database["public"]["Enums"]["team_priority"]
          technical_specifications?: string | null
          title?: string
          total_days?: number
          updated_at?: string
          working_days?: string[] | null
        }
        Relationships: []
      }
      maintenance_orders: {
        Row: {
          created_at: string
          equipment_item_id: string
          event_id: string | null
          id: string
          notes: string | null
          opened_by: string
          requested_action: string
          status: Database["public"]["Enums"]["maintenance_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_item_id: string
          event_id?: string | null
          id?: string
          notes?: string | null
          opened_by: string
          requested_action?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_item_id?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          opened_by?: string
          requested_action?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_orders_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_required: boolean
          created_at: string
          id: string
          message: string
          priority: Database["public"]["Enums"]["notification_priority"]
          read: boolean
          related_event_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_required?: boolean
          created_at?: string
          id?: string
          message: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          related_event_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_required?: boolean
          created_at?: string
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          related_event_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          allocation_id: string
          amount: number
          created_at: string
          event_id: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          receipt_file: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_id: string
          amount: number
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_file?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_id?: string
          amount?: number
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_file?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "team_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          audio_visual_roles: string[] | null
          avatar: string | null
          average_rating: number | null
          bio: string | null
          certifications: string[] | null
          city: string | null
          cpf: string | null
          created_at: string
          daily_rate: number | null
          email: string
          equipment: string[] | null
          experience_level: Database["public"]["Enums"]["experience_level"]
          hourly_rate: number | null
          id: string
          instagram: string | null
          is_active: boolean
          languages: string[] | null
          linkedin: string | null
          name: string
          phone: string | null
          portfolio: string | null
          previous_experience: string | null
          state: string | null
          team_type: Database["public"]["Enums"]["team_type"] | null
          total_earnings: number
          total_events_attended: number
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          audio_visual_roles?: string[] | null
          avatar?: string | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          daily_rate?: number | null
          email: string
          equipment?: string[] | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          languages?: string[] | null
          linkedin?: string | null
          name: string
          phone?: string | null
          portfolio?: string | null
          previous_experience?: string | null
          state?: string | null
          team_type?: Database["public"]["Enums"]["team_type"] | null
          total_earnings?: number
          total_events_attended?: number
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          audio_visual_roles?: string[] | null
          avatar?: string | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string
          equipment?: string[] | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          languages?: string[] | null
          linkedin?: string | null
          name?: string
          phone?: string | null
          portfolio?: string | null
          previous_experience?: string | null
          state?: string | null
          team_type?: Database["public"]["Enums"]["team_type"] | null
          total_earnings?: number
          total_events_attended?: number
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      team_allocations: {
        Row: {
          assigned_at: string
          assigned_role: string
          attended: boolean
          cancellation_deadline: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in_time: string | null
          check_out_time: string | null
          confirmation_deadline: string | null
          confirmed_at: string | null
          created_at: string
          daily_rate: number
          event_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["allocation_status"]
          total_days: number
          total_hours: number
          total_payment: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_role: string
          attended?: boolean
          cancellation_deadline?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          created_at?: string
          daily_rate?: number
          event_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["allocation_status"]
          total_days?: number
          total_hours?: number
          total_payment?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_role?: string
          attended?: boolean
          cancellation_deadline?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          created_at?: string
          daily_rate?: number
          event_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["allocation_status"]
          total_days?: number
          total_hours?: number
          total_payment?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          audio_visual_roles: string[]
          avatar: string
          average_rating: number
          bio: string
          created_at: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean
          languages: string[]
          name: string
          team_type: Database["public"]["Enums"]["team_type"]
          total_events_attended: number
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_public_profiles: {
        Args: never
        Returns: {
          audio_visual_roles: string[]
          avatar: string
          average_rating: number
          bio: string
          created_at: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean
          languages: string[]
          name: string
          team_type: Database["public"]["Enums"]["team_type"]
          total_events_attended: number
          user_id: string
        }[]
      }
    }
    Enums: {
      allocation_status: "pending" | "confirmed" | "rejected" | "cancelled"
      app_role: "gestor" | "freelancer" | "lider_freelancer"
      attendance_status: "present" | "absent" | "late" | "pending"
      equipment_condition: "excellent" | "good" | "fair" | "poor" | "damaged"
      equipment_item_status: "in_service" | "maintenance" | "retired" | "lost"
      event_status:
        | "planning"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      event_type: "normal" | "especial"
      experience_level: "iniciante" | "intermediario" | "avancado" | "expert"
      interest_status: "interested" | "not_interested" | "cancelled"
      maintenance_status: "open" | "in_progress" | "completed" | "discarded"
      notification_priority: "low" | "medium" | "high" | "urgent"
      notification_type:
        | "allocation"
        | "update"
        | "reminder"
        | "checkin"
        | "payment"
        | "schedule_conflict"
      payment_status: "pending" | "approved" | "paid" | "cancelled"
      reservation_status: "reserved" | "checked_out" | "returned" | "cancelled"
      team_priority: "iniciante" | "intermediario" | "avancado" | "ambas"
      team_type: "iniciante" | "intermediario" | "avancado" | "sem_equipe"
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
      allocation_status: ["pending", "confirmed", "rejected", "cancelled"],
      app_role: ["gestor", "freelancer", "lider_freelancer"],
      attendance_status: ["present", "absent", "late", "pending"],
      equipment_condition: ["excellent", "good", "fair", "poor", "damaged"],
      equipment_item_status: ["in_service", "maintenance", "retired", "lost"],
      event_status: [
        "planning",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      event_type: ["normal", "especial"],
      experience_level: ["iniciante", "intermediario", "avancado", "expert"],
      interest_status: ["interested", "not_interested", "cancelled"],
      maintenance_status: ["open", "in_progress", "completed", "discarded"],
      notification_priority: ["low", "medium", "high", "urgent"],
      notification_type: [
        "allocation",
        "update",
        "reminder",
        "checkin",
        "payment",
        "schedule_conflict",
      ],
      payment_status: ["pending", "approved", "paid", "cancelled"],
      reservation_status: ["reserved", "checked_out", "returned", "cancelled"],
      team_priority: ["iniciante", "intermediario", "avancado", "ambas"],
      team_type: ["iniciante", "intermediario", "avancado", "sem_equipe"],
    },
  },
} as const
