// Configuração centralizada do Supabase
// Este arquivo garante que as variáveis estejam sempre disponíveis

export const SUPABASE_CONFIG = {
  url: (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aqvqpkmjdtzeoclndwhj.supabase.co').trim(),
  anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY').trim(),
  serviceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs').trim()
}

// Log para debug
if (typeof window !== 'undefined') {
  console.log('🔧 SUPABASE_CONFIG carregado:', {
    url: SUPABASE_CONFIG.url,
    anonKey: SUPABASE_CONFIG.anonKey ? 'Configurada' : 'Missing',
    serviceRoleKey: SUPABASE_CONFIG.serviceRoleKey ? 'Configurada' : 'Missing'
  })
}
