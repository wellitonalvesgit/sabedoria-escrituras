import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './supabase-config'

/**
 * Cliente Supabase Admin para uso em componentes client-side
 * ATENÇÃO: Usa apenas a anon key, não a service role key
 * Para operações administrativas server-side, use supabaseAdmin de lib/supabase.ts
 */
export function getSupabaseClient() {
  // Usar configuração centralizada
  const supabaseUrl = SUPABASE_CONFIG.url
  const supabaseKey = SUPABASE_CONFIG.anonKey

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Variáveis de ambiente do Supabase não configuradas. ' +
      'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env'
    )
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Hook para usar em componentes client
 */
export const useSupabase = () => {
  return getSupabaseClient()
}
