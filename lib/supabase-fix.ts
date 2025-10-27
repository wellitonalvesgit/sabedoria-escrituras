"use client"

import { createClient } from '@supabase/supabase-js'

// Validar variáveis de ambiente obrigatórias
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

// SOLUÇÃO: Criar uma única instância do cliente Supabase
// Isso resolve o problema de múltiplas instâncias do GoTrueClient
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
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

// Função para limpar o cache do cliente e forçar uma nova inicialização
export function resetSupabaseClient() {
  if (typeof window !== 'undefined') {
    supabaseInstance = null
    return getSupabaseClient()
  }
  return supabase
}

// Função para verificar se o usuário tem acesso a um curso
export async function checkCourseAccess(courseId: string) {
  try {
    // Primeiro, verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        canAccess: false,
        reason: 'no_access',
        message: 'Usuário não autenticado'
      }
    }
    
    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      
    if (userError || !userData) {
      console.error('Erro ao buscar dados do usuário:', userError)
      return {
        canAccess: false,
        reason: 'no_access',
        message: 'Erro ao verificar permissões'
      }
    }
    
    // Verificar se o curso está na lista de cursos permitidos
    if (userData.allowed_courses && userData.allowed_courses.includes(courseId)) {
      return {
        canAccess: true,
        reason: 'premium_access',
        message: 'Acesso permitido'
      }
    }
    
    // Verificar se o curso está na lista de cursos bloqueados
    if (userData.blocked_courses && userData.blocked_courses.includes(courseId)) {
      return {
        canAccess: false,
        reason: 'no_access',
        message: 'Acesso bloqueado para este curso'
      }
    }
    
    // Verificar se o curso é gratuito
    const { data: course } = await supabase
      .from('courses')
      .select('is_free')
      .eq('id', courseId)
      .single()
      
    if (course?.is_free) {
      return {
        canAccess: true,
        reason: 'free_course',
        message: 'Curso gratuito'
      }
    }
    
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Este curso requer assinatura premium'
    }
    
  } catch (error) {
    console.error('Erro ao verificar acesso ao curso:', error)
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Erro ao verificar acesso'
    }
  }
}
