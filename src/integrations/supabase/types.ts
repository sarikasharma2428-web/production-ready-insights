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
      alerts: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          current_value: number | null
          description: string | null
          fired_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          metric_name: string | null
          name: string | null
          resolved_at: string | null
          service_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          silenced_until: string | null
          threshold: number | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          fired_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          metric_name?: string | null
          name?: string | null
          resolved_at?: string | null
          service_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          silenced_until?: string | null
          threshold?: number | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          fired_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          metric_name?: string | null
          name?: string | null
          resolved_at?: string | null
          service_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          silenced_until?: string | null
          threshold?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_number: string
          resolved_at: string | null
          service_id: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          started_at: string
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_number: string
          resolved_at?: string | null
          service_id?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          started_at?: string
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_number?: string
          resolved_at?: string | null
          service_id?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          started_at?: string
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["log_level"]
          message: string
          metadata: Json | null
          service_id: string | null
          trace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          message: string
          metadata?: Json | null
          service_id?: string | null
          trace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          metadata?: Json | null
          service_id?: string | null
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          cpu_usage: number | null
          created_at: string
          description: string | null
          display_name: string
          error_rate: number | null
          id: string
          last_checked_at: string | null
          latency_p50: number | null
          latency_p99: number | null
          memory_usage: number | null
          name: string
          request_count: number | null
          requests_per_second: number | null
          status: string | null
          updated_at: string
          uptime: number | null
        }
        Insert: {
          cpu_usage?: number | null
          created_at?: string
          description?: string | null
          display_name: string
          error_rate?: number | null
          id?: string
          last_checked_at?: string | null
          latency_p50?: number | null
          latency_p99?: number | null
          memory_usage?: number | null
          name: string
          request_count?: number | null
          requests_per_second?: number | null
          status?: string | null
          updated_at?: string
          uptime?: number | null
        }
        Update: {
          cpu_usage?: number | null
          created_at?: string
          description?: string | null
          display_name?: string
          error_rate?: number | null
          id?: string
          last_checked_at?: string | null
          latency_p50?: number | null
          latency_p99?: number | null
          memory_usage?: number | null
          name?: string
          request_count?: number | null
          requests_per_second?: number | null
          status?: string | null
          updated_at?: string
          uptime?: number | null
        }
        Relationships: []
      }
      slos: {
        Row: {
          created_at: string
          current_availability: number
          error_budget_consumed: number | null
          error_budget_total: number
          id: string
          is_breaching: boolean | null
          is_budget_exhausted: boolean | null
          latency_current: number | null
          latency_target: number
          name: string
          service_id: string | null
          target_availability: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_availability?: number
          error_budget_consumed?: number | null
          error_budget_total?: number
          id?: string
          is_breaching?: boolean | null
          is_budget_exhausted?: boolean | null
          latency_current?: number | null
          latency_target?: number
          name: string
          service_id?: string | null
          target_availability?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_availability?: number
          error_budget_consumed?: number | null
          error_budget_total?: number
          id?: string
          is_breaching?: boolean | null
          is_budget_exhausted?: boolean | null
          latency_current?: number | null
          latency_target?: number
          name?: string
          service_id?: string | null
          target_availability?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_severity: "INFO" | "WARNING" | "CRITICAL"
      incident_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      incident_status: "OPEN" | "ONGOING" | "RESOLVED"
      log_level: "DEBUG" | "INFO" | "WARN" | "ERROR"
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
      alert_severity: ["INFO", "WARNING", "CRITICAL"],
      incident_severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      incident_status: ["OPEN", "ONGOING", "RESOLVED"],
      log_level: ["DEBUG", "INFO", "WARN", "ERROR"],
    },
  },
} as const
