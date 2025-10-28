/**
 * Script para invalidar TODAS as sessões de um usuário específico
 * Isso força o usuário a fazer login novamente com os dados atualizados
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const userEmail = 'geisonhoehr@gmail.com'

async function invalidateAllSessions() {
  try {
    console.log('🚀 Invalidando todas as sessões...\n')

    // 1. Buscar usuário
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', userEmail)
      .single()

    if (!users) {
      console.error(`❌ Usuário ${userEmail} não encontrado`)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${users.id}`)
    console.log(`   Email: ${users.email}`)
    console.log(`   Nome: ${users.name}`)
    console.log(`   Role: ${users.role}\n`)

    // 2. Usar API Admin para sign out de TODAS as sessões
    console.log('🔄 Invalidando sessões via Admin API...')

    const { error } = await supabase.auth.admin.signOut(users.id, 'global')

    if (error) {
      console.error('❌ Erro ao invalidar sessões:', error.message)
      console.log('\n⚠️  Método 1 falhou. Tentando método alternativo...\n')

      // Método alternativo: Atualizar updated_at do usuário para forçar revalidação
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        users.id,
        {
          user_metadata: {
            name: users.name,
            role: users.role,
            email_verified: true,
            force_logout: new Date().toISOString() // Timestamp para forçar revalidação
          }
        }
      )

      if (updateError) {
        console.error('❌ Erro no método alternativo:', updateError.message)
        console.log('\n⚠️  SOLUÇÃO: O usuário DEVE fazer logout manualmente e login novamente\n')
        return
      }

      console.log('✅ Metadata atualizada com timestamp de força de logout')
      console.log('⚠️  Usuário DEVE fazer logout e login para pegar nova sessão\n')
      return
    }

    console.log('✅ Todas as sessões foram invalidadas!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. O usuário será deslogado automaticamente')
    console.log('2. Ao fazer login novamente, verá role=admin corretamente')
    console.log('3. O painel administrativo aparecerá\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

invalidateAllSessions()
