/**
 * Cliente Supabase Admin - APENAS para uso SERVER-SIDE
 *
 * IMPORTANTE: Este arquivo só deve ser importado em:
 * - API routes (app/api/**/route.ts)
 * - Server components (RSC)
 * - Server actions
 *
 * NUNCA importe em componentes com "use client"
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './supabase-config'

if (typeof window !== 'undefined') {
  throw new Error(
    '❌ supabase-server.ts não pode ser importado no client-side!\n' +
    'Use lib/supabase.ts para componentes client-side.'
  )
}

// Cliente admin com service role key - bypassa Row Level Security (RLS)
export const supabaseAdmin = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
