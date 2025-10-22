import { createClient } from '@supabase/supabase-js'

// Validar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Cliente público (usar em componentes client-side e server-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin (APENAS para uso server-side - API routes, server components)
// Bypassa Row Level Security
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'moderator' | 'student'
          status: 'active' | 'inactive' | 'suspended'
          total_points: number
          total_reading_minutes: number
          courses_enrolled: number
          courses_completed: number
          current_level: number
          created_at: string
          updated_at: string
          last_active_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      courses: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          author: string | null
          category: string | null
          pages: number | null
          reading_time_minutes: number | null
          cover_url: string | null
          status: 'draft' | 'published' | 'archived'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
      }
      course_pdfs: {
        Row: {
          id: string
          course_id: string
          volume: string
          title: string
          url: string
          pages: number | null
          reading_time_minutes: number | null
          text_content: string | null
          use_auto_conversion: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['course_pdfs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['course_pdfs']['Insert']>
      }
    }
  }
}
