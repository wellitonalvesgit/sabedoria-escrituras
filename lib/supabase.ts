import { createClient } from '@supabase/supabase-js'

// Validar variáveis de ambiente obrigatórias
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Verificar se variáveis críticas estão configuradas
if (!supabaseUrl) {
  throw new Error(
    '❌ NEXT_PUBLIC_SUPABASE_URL não está configurada. ' +
    'Adicione no arquivo .env.local'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada. ' +
    'Adicione no arquivo .env.local'
  )
}

// Log para debug (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase URL:', supabaseUrl)
  console.log('✅ Supabase Anon Key:', supabaseAnonKey ? 'Configurada' : 'Missing')
  console.log('✅ Service Role Key:', supabaseServiceRoleKey ? 'Configurada' : 'Missing')
}

// Cliente público (usar em componentes client-side e server-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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
          access_days: number | null
          access_expires_at: string | null
          allowed_categories: string[] | null
          blocked_categories: string[] | null
          allowed_courses: string[] | null
          blocked_courses: string[] | null
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
