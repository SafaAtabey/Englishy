import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          native_language: string
          cefr_level: string
          subscription_plan: string
          stripe_customer_id: string | null
          daily_goal: number
          streak_count: number
          last_active: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['users']['Row']>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      words: {
        Row: {
          id: string
          word: string
          phonetic: string
          definition: string
          translation_turkish: string
          part_of_speech: string
          cefr_level: string
          examples: string[]
          synonyms: string[]
          word_family: string[]
          source: string
        }
      }
      user_words: {
        Row: {
          id: string
          user_id: string
          word_id: string
          status: string
          ease_factor: number
          interval_days: number
          next_review_date: string | null
          times_seen: number
          times_correct: number
        }
        Insert: Partial<Database['public']['Tables']['user_words']['Row']>
        Update: Partial<Database['public']['Tables']['user_words']['Row']>
      }
    }
  }
}
