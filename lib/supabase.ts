import { createClient } from '@supabase/supabase-js'

// Exportar createClient para uso em outros arquivos
export { createClient }

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

// SOLUÇÃO DE EMERGÊNCIA: Definir SERVICE_ROLE_KEY diretamente no código
// Isso é apenas uma solução temporária para desenvolvimento
if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'development') {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs';
}

// Log para debug (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase URL:', supabaseUrl)
  console.log('✅ Supabase Anon Key:', supabaseAnonKey ? 'Configurada' : 'Missing')
  console.log('✅ Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Missing')
}

// Instância singleton para evitar múltiplas instâncias do GoTrueClient
// IMPORTANTE: Isso resolve o aviso "Multiple GoTrueClient instances detected"
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  // Server-side: sempre criar nova instância
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }

  // Client-side: usar singleton para evitar múltiplas instâncias
  if (!supabaseInstance) {
    console.log('🔧 Criando instância singleton do Supabase Client')
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'sb-auth-token',
        flowType: 'pkce'
      }
    })
  }

  return supabaseInstance
}

// Cliente público (usar em componentes client-side e server-side)
export const supabase = getSupabaseClient()

// Cliente admin (APENAS para uso server-side - API routes, server components)
// Bypassa Row Level Security
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
