import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase Admin para uso em componentes client-side
 * ATENÇÃO: Usa apenas a anon key, não a service role key
 * Para operações administrativas server-side, use supabaseAdmin de lib/supabase.ts
 */
export function getSupabaseClient() {
  // SOLUÇÃO TEMPORÁRIA: Hardcode para produção até resolver problema da Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'

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
