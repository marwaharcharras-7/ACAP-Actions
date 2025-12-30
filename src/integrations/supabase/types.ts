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
      action_history: {
        Row: {
          action_id: string
          created_at: string
          details: string | null
          event_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_id: string
          created_at?: string
          details?: string | null
          event_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_id?: string
          created_at?: string
          details?: string | null
          event_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_history_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          category_5m: Database["public"]["Enums"]["category_5m"] | null
          comments: string | null
          completed_at: string | null
          created_at: string
          created_by_id: string
          description: string
          due_date: string
          efficiency_percent: number | null
          finalized_at: string | null
          id: string
          is_effective: boolean | null
          line_id: string | null
          pilot_id: string
          post_id: string | null
          problem: string
          progress_percent: number
          root_cause: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["action_status"]
          team_id: string | null
          title: string
          type: Database["public"]["Enums"]["action_type"]
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          validated_at: string | null
        }
        Insert: {
          category_5m?: Database["public"]["Enums"]["category_5m"] | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_id: string
          description: string
          due_date: string
          efficiency_percent?: number | null
          finalized_at?: string | null
          id?: string
          is_effective?: boolean | null
          line_id?: string | null
          pilot_id: string
          post_id?: string | null
          problem: string
          progress_percent?: number
          root_cause?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          team_id?: string | null
          title: string
          type: Database["public"]["Enums"]["action_type"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          validated_at?: string | null
        }
        Update: {
          category_5m?: Database["public"]["Enums"]["category_5m"] | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_id?: string
          description?: string
          due_date?: string
          efficiency_percent?: number | null
          finalized_at?: string | null
          id?: string
          is_effective?: boolean | null
          line_id?: string | null
          pilot_id?: string
          post_id?: string | null
          problem?: string
          progress_percent?: number
          root_cause?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          team_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          action_id: string
          created_at: string
          id: string
          name: string
          size: number
          type: string
          uploaded_by_id: string
          url: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          name: string
          size: number
          type: string
          uploaded_by_id: string
          url: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          name?: string
          size?: number
          type?: string
          uploaded_by_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      factories: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      lines: {
        Row: {
          created_at: string
          id: string
          name: string
          service_id: string
          supervisor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          service_id: string
          supervisor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          service_id?: string
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lines_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lines_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_action_id: string | null
          related_user_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_action_id?: string | null
          related_user_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_action_id?: string | null
          related_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_action_id_fkey"
            columns: ["related_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          created_at: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          cv_url: string | null
          date_of_birth: string | null
          email: string
          factory_id: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string
          line_id: string | null
          phone: string | null
          post_id: string | null
          service_id: string | null
          skills: string[] | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cv_url?: string | null
          date_of_birth?: string | null
          email: string
          factory_id?: string | null
          first_name: string
          hire_date?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          last_name: string
          line_id?: string | null
          phone?: string | null
          post_id?: string | null
          service_id?: string | null
          skills?: string[] | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cv_url?: string | null
          date_of_birth?: string | null
          email?: string
          factory_id?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          line_id?: string | null
          phone?: string | null
          post_id?: string | null
          service_id?: string | null
          skills?: string[] | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          factory_id: string | null
          id: string
          name: string
          responsible_id: string | null
        }
        Insert: {
          created_at?: string
          factory_id?: string | null
          id?: string
          name: string
          responsible_id?: string | null
        }
        Update: {
          created_at?: string
          factory_id?: string | null
          id?: string
          name?: string
          responsible_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          leader_id: string | null
          line_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_id?: string | null
          line_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_id?: string | null
          line_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "lines"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      action_status:
        | "identified"
        | "planned"
        | "in_progress"
        | "completed"
        | "late"
        | "validated"
        | "archived"
      action_type: "corrective" | "preventive"
      app_role: "operator" | "team_leader" | "supervisor" | "manager" | "admin"
      category_5m: "main_oeuvre" | "matiere" | "methode" | "milieu" | "machine"
      urgency_level: "low" | "medium" | "high"
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
      action_status: [
        "identified",
        "planned",
        "in_progress",
        "completed",
        "late",
        "validated",
        "archived",
      ],
      action_type: ["corrective", "preventive"],
      app_role: ["operator", "team_leader", "supervisor", "manager", "admin"],
      category_5m: ["main_oeuvre", "matiere", "methode", "milieu", "machine"],
      urgency_level: ["low", "medium", "high"],
    },
  },
} as const
