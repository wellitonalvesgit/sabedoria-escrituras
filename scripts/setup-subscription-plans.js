require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupSubscriptionPlans() {
  console.log('\n🚀 CONFIGURANDO OS PLANOS DE ASSINATURA\n')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar se a tabela existe
    console.log('\n1️⃣ Verificando tabela subscription_plans...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscription_plans')

    if (tableError || !tables || tables.length === 0) {
      console.log('   ❌ Tabela subscription_plans não existe!')
      console.log('   📝 Execute primeiro a migração: supabase-subscriptions-system.sql')
      return
    }

    console.log('   ✅ Tabela subscription_plans encontrada')

    // 2. Verificar se já existem planos
    console.log('\n2️⃣ Verificando planos existentes...')
    const { data: existingPlans, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')

    if (fetchError) {
      console.log('   ❌ Erro ao buscar planos:', fetchError.message)
      return
    }

    if (existingPlans && existingPlans.length > 0) {
      console.log(`   📊 Encontrados ${existingPlans.length} planos existentes`)
      console.log('   🔄 Atualizando planos existentes...')
      
      // Atualizar planos existentes
      for (const plan of existingPlans) {
        const updatedPlan = getPlanData(plan.name)
        if (updatedPlan) {
          const { error: updateError } = await supabase
            .from('subscription_plans')
            .update(updatedPlan)
            .eq('id', plan.id)

          if (updateError) {
            console.log(`   ❌ Erro ao atualizar plano ${plan.name}:`, updateError.message)
          } else {
            console.log(`   ✅ Plano ${plan.name} atualizado`)
          }
        }
      }
    } else {
      console.log('   📝 Nenhum plano encontrado, criando novos...')
      
      // 3. Criar os 3 planos
      const plans = [
        {
          name: 'free-trial',
          display_name: '🆓 Free Trial',
          description: 'Experimente nossa plataforma por 7 dias gratuitamente',
          price_monthly: 0,
          price_yearly: 0,
          trial_days: 7,
          duration_days: 7,
          features: [
            '✅ 7 dias de acesso gratuito',
            '✅ Cursos gratuitos apenas',
            '✅ Sistema de gamificação',
            '✅ Suporte por email',
            '✅ Acesso básico à plataforma'
          ],
          is_active: true,
          sort_order: 1
        },
        {
          name: 'basico',
          display_name: '📦 Básico',
          description: 'Acesso completo por 2 meses com todos os recursos',
          price_monthly: 49.90,
          price_yearly: 0,
          trial_days: 0,
          duration_days: 60,
          features: [
            '✅ 60 dias de acesso (2 meses)',
            '✅ TODOS os cursos disponíveis',
            '✅ Sistema de marcação (Kindle)',
            '✅ Sistema de gamificação completo',
            '✅ Certificados de conclusão',
            '✅ Suporte prioritário',
            '✅ Download de PDFs',
            '✅ Acesso offline'
          ],
          is_active: true,
          sort_order: 2
        },
        {
          name: 'premium',
          display_name: '💎 Premium',
          description: 'Acesso ilimitado com todos os recursos e benefícios exclusivos',
          price_monthly: 97.90,
          price_yearly: 997.90,
          trial_days: 0,
          duration_days: null, // Ilimitado
          features: [
            '✅ Acesso ILIMITADO',
            '✅ TODOS os cursos disponíveis',
            '✅ Novos cursos automaticamente',
            '✅ Sistema de marcação avançado',
            '✅ Sistema de gamificação completo',
            '✅ Certificados de conclusão',
            '✅ Suporte prioritário 24/7',
            '✅ Download de PDFs',
            '✅ Acesso offline',
            '✅ Recursos exclusivos',
            '✅ Comunidade VIP',
            '✅ Desconto anual de 15%'
          ],
          is_active: true,
          sort_order: 3
        }
      ]

      for (const plan of plans) {
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert(plan)
          .select()

        if (error) {
          console.log(`   ❌ Erro ao criar plano ${plan.name}:`, error.message)
        } else {
          console.log(`   ✅ Plano ${plan.name} criado com sucesso`)
        }
      }
    }

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!')
    console.log('=' .repeat(60))
    console.log('📋 Planos configurados:')
    console.log('   🆓 Free Trial - 7 dias gratuito')
    console.log('   📦 Básico - R$ 49,90 por 2 meses')
    console.log('   💎 Premium - R$ 97,90/mês ou R$ 997,90/ano')
    console.log('\n🔗 Acesse /admin/plans para gerenciar os planos')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

function getPlanData(planName) {
  const plans = {
    'free-trial': {
      display_name: '🆓 Free Trial',
      description: 'Experimente nossa plataforma por 7 dias gratuitamente',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 7,
      duration_days: 7,
      features: [
        '✅ 7 dias de acesso gratuito',
        '✅ Cursos gratuitos apenas',
        '✅ Sistema de gamificação',
        '✅ Suporte por email',
        '✅ Acesso básico à plataforma'
      ],
      is_active: true,
      sort_order: 1
    },
    'basico': {
      display_name: '📦 Básico',
      description: 'Acesso completo por 2 meses com todos os recursos',
      price_monthly: 49.90,
      price_yearly: 0,
      trial_days: 0,
      duration_days: 60,
      features: [
        '✅ 60 dias de acesso (2 meses)',
        '✅ TODOS os cursos disponíveis',
        '✅ Sistema de marcação (Kindle)',
        '✅ Sistema de gamificação completo',
        '✅ Certificados de conclusão',
        '✅ Suporte prioritário',
        '✅ Download de PDFs',
        '✅ Acesso offline'
      ],
      is_active: true,
      sort_order: 2
    },
    'premium': {
      display_name: '💎 Premium',
      description: 'Acesso ilimitado com todos os recursos e benefícios exclusivos',
      price_monthly: 97.90,
      price_yearly: 997.90,
      trial_days: 0,
      duration_days: null,
      features: [
        '✅ Acesso ILIMITADO',
        '✅ TODOS os cursos disponíveis',
        '✅ Novos cursos automaticamente',
        '✅ Sistema de marcação avançado',
        '✅ Sistema de gamificação completo',
        '✅ Certificados de conclusão',
        '✅ Suporte prioritário 24/7',
        '✅ Download de PDFs',
        '✅ Acesso offline',
        '✅ Recursos exclusivos',
        '✅ Comunidade VIP',
        '✅ Desconto anual de 15%'
      ],
      is_active: true,
      sort_order: 3
    }
  }

  return plans[planName]
}

// Executar se chamado diretamente
if (require.main === module) {
  setupSubscriptionPlans()
}

module.exports = { setupSubscriptionPlans }

