// Database types for VoChat

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
      user_settings: {
        Row: {
          user_id: string
          privacy_mode: boolean
          preferred_language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          privacy_mode?: boolean
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          privacy_mode?: boolean
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
      }
      app_profiles: {
        Row: {
          id: string
          user_id: string
          app_key: string
          tone: string
          language: string
          formatting: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          app_key: string
          tone?: string
          language?: string
          formatting?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          app_key?: string
          tone?: string
          language?: string
          formatting?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dictionary_terms: {
        Row: {
          id: string
          user_id: string
          term: string
          phonetic: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          term: string
          phonetic?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          term?: string
          phonetic?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      snippets: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          trigger_phrase: string | null
          variables: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          trigger_phrase?: string | null
          variables?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          trigger_phrase?: string | null
          variables?: Json
          created_at?: string
          updated_at?: string
        }
      }
      usage_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          quantity: number
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          quantity: number
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          quantity?: number
          meta?: Json
          created_at?: string
        }
      }
    }
  }
}

// Derived types
export type AppProfile = Database['public']['Tables']['app_profiles']['Row']
export type AppProfileInsert = Database['public']['Tables']['app_profiles']['Insert']
export type AppProfileUpdate = Database['public']['Tables']['app_profiles']['Update']

export type DictionaryTerm = Database['public']['Tables']['dictionary_terms']['Row']
export type Snippet = Database['public']['Tables']['snippets']['Row']
export type UsageEvent = Database['public']['Tables']['usage_events']['Row']

// Formatting options interface
export interface ProfileFormatting {
  bullets?: boolean
  max_length?: number
  capitalization?: 'preserve' | 'sentence' | 'title' | 'lower' | 'upper'
  paragraphs?: boolean
  preserve_code?: boolean
}

// App key constants
export const APP_KEYS = [
  'generic',
  'slack',
  'gmail',
  'docs',
  'terminal',
  'notion',
  'discord',
  'teams',
  'linkedin',
] as const

export type AppKey = typeof APP_KEYS[number]

// Tone constants
export const TONES = [
  'professional',
  'casual',
  'friendly',
  'direct',
  'technical',
  'empathetic',
  'formal',
] as const

export type Tone = typeof TONES[number]

// Language constants
export const LANGUAGES = [
  'en',
  'nl',
  'es',
  'fr',
  'de',
] as const

export type Language = typeof LANGUAGES[number]
