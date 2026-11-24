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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      call_events: {
        Row: {
          call_id: string
          created_at: string
          duration_seconds: number | null
          event: string
          id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          duration_seconds?: number | null
          event: string
          id?: string
        }
        Update: {
          call_id?: string
          created_at?: string
          duration_seconds?: number | null
          event?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_events_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_viewers: {
        Row: {
          blocked_attempts: number
          call_id: string
          first_seen_at: string
          id: string
          locked_at: string | null
          locked_reason: string | null
          token_hash: string
        }
        Insert: {
          blocked_attempts?: number
          call_id: string
          first_seen_at?: string
          id?: string
          locked_at?: string | null
          locked_reason?: string | null
          token_hash: string
        }
        Update: {
          blocked_attempts?: number
          call_id?: string
          first_seen_at?: string
          id?: string
          locked_at?: string | null
          locked_reason?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_viewers_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          archived: boolean
          background_url: string | null
          contact_id: string | null
          created_at: string
          fullscreen_video: boolean
          id: string
          is_active: boolean
          person_name: string
          person_photo_url: string | null
          preview_description: string | null
          preview_image_url: string | null
          preview_title: string | null
          ringtone_type: string
          ringtone_value: string
          single_view: boolean
          slug: string
          subtitle: string
          theme: string
          title: string
          unmute_button: boolean
          used_message: string | null
          user_id: string
          vibrate: boolean
          video_type: string
          video_url: string
        }
        Insert: {
          archived?: boolean
          background_url?: string | null
          contact_id?: string | null
          created_at?: string
          fullscreen_video?: boolean
          id?: string
          is_active?: boolean
          person_name?: string
          person_photo_url?: string | null
          preview_description?: string | null
          preview_image_url?: string | null
          preview_title?: string | null
          ringtone_type?: string
          ringtone_value?: string
          single_view?: boolean
          slug: string
          subtitle?: string
          theme?: string
          title?: string
          unmute_button?: boolean
          used_message?: string | null
          user_id?: string
          vibrate?: boolean
          video_type?: string
          video_url?: string
        }
        Update: {
          archived?: boolean
          background_url?: string | null
          contact_id?: string | null
          created_at?: string
          fullscreen_video?: boolean
          id?: string
          is_active?: boolean
          person_name?: string
          person_photo_url?: string | null
          preview_description?: string | null
          preview_image_url?: string | null
          preview_title?: string | null
          ringtone_type?: string
          ringtone_value?: string
          single_view?: boolean
          slug?: string
          subtitle?: string
          theme?: string
          title?: string
          unmute_button?: boolean
          used_message?: string | null
          user_id?: string
          vibrate?: boolean
          video_type?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_contact_owner_fkey"
            columns: ["contact_id", "user_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_url: string | null
          subtitle: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          subtitle?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          subtitle?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_view: {
        Args: { p_preview?: boolean; p_slug: string; p_token: string }
        Returns: string
      }
      finish_view: {
        Args: { p_reason?: string; p_slug: string; p_token: string }
        Returns: undefined
      }
      get_public_call: {
        Args: { call_slug: string }
        Returns: {
          background_url: string
          fullscreen_video: boolean
          id: string
          is_active: boolean
          person_name: string
          person_photo_url: string
          preview_description: string
          preview_image_url: string
          preview_title: string
          ringtone_type: string
          ringtone_value: string
          single_view: boolean
          slug: string
          subtitle: string
          theme: string
          unmute_button: boolean
          used_message: string
          vibrate: boolean
          video_type: string
          video_url: string
        }[]
      }
      log_public_call_event: {
        Args: { call_slug: string; duration?: number; event_name: string }
        Returns: undefined
      }
      reset_viewers: { Args: { p_call_id: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
