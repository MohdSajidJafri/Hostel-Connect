export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          avatar_url: string | null
          year_of_study: number | null
          expertise: string | null
          domain: string | null
          room_number: string | null
          contact_info: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          avatar_url?: string | null
          year_of_study?: number | null
          expertise?: string | null
          domain?: string | null
          room_number?: string | null
          contact_info?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          avatar_url?: string | null
          year_of_study?: number | null
          expertise?: string | null
          domain?: string | null
          room_number?: string | null
          contact_info?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      blocked_users: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
      }
      message_reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          reason?: string
          created_at?: string
        }
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
  }
}
