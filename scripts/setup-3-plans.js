require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setup3Plans() {
  console.log('\n🚀 CONFIGURANDO OS 3 PLANOS DE ASSINATURA\n')
  console.log('='  .repeat(60))

  // 1. Adicionar campo duration_days se não existir
  console.log('\n1️⃣ Verificando campo duration_days...')
  console.log('   ⚠️  Campo duration_days será adicionado manualmente se necessário')
  console.log('   (Este campo armazena a duração do plano em dias, null = ilimitado)')

  // 2. Deletar planos antigos
  console.log('\n2️⃣ Removendo planos antigos...')
  const { error: deleteError } = await supabase
    .from('subscription_plans')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

  if (deleteError) {
    console.log('   ⚠️  Erro ao deletar (pode ser que não tenha nenhum):', deleteError.message)
  } else {
    console.log('   ✅ Planos antigos removidos')
  }

  // 3. Criar os 3 novos planos
  console.log('\n3️⃣ Criando os 3 novos planos...')

  const newPlans = [
    {
      name: 'free-trial',
      display_name: '🆓 Free Trial',
      description: 'Teste gratuito por 7 dias - Acesso apenas a cursos gratuitos',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 7,
      duration_days: 7,
      features: [
        '✅ 7 dias de acesso',
        '✅ Cursos gratuitos apenas',
        '✅ Sistema de gamificação',
        '✅ Suporte por email'
      ],
      is_active: true,
      sort_order: 1
    },
    {
      name: 'basico',
      display_name: '📦 Básico',
      description: 'Acesso completo por 2 meses - Ideal para estudar cursos específicos',
      price_monthly: 49.90,
      price_yearly: 0,
      trial_days: 0,
      duration_days: 60, // 2 meses = 60 dias
      features: [
        '✅ 60 dias de acesso (2 meses)',
        '✅ TODOS os cursos',
        '✅ Sistema de marcação (Kindle)',
        '✅ Sistema de gamificação',
        '✅ Certificados de conclusão',
        '✅ Suporte prioritário'
      ],
      is_active: true,
      sort_order: 2
    },
    {
      name: 'premium',
      display_name: '💎 Premium',
      description: 'Acesso ILIMITADO - Melhor custo-benefício para estudantes contínuos',
      price_monthly: 29.90,
      price_yearly: 297.00, // ~24,75/mês (economiza 17%)
      trial_days: 0,
      duration_days: null, // null = ilimitado
      features: [
        '✅ Acesso ILIMITADO vitalício',
        '✅ TODOS os cursos',
        '✅ Novos cursos todo mês',
        '✅ Sistema de marcação (Kindle)',
        '✅ Sistema de gamificação',
        '✅ Certificados de conclusão',
        '✅ Downloads ilimitados',
        '✅ Suporte prioritário',
        '💰 Pague mensal ou anual (17% desconto)'
      ],
      is_active: true,
      sort_order: 3
    }
  ]

  for (const plan of newPlans) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert(plan)
      .select()
      .single()

    if (error) {
      console.log(`   ❌ Erro ao criar plano "${plan.display_name}":`, error.message)
    } else {
      console.log(`   ✅ Plano "${plan.display_name}" criado com sucesso!`)
      console.log(`      ID: ${data.id}`)
      console.log(`      Preço mensal: R$ ${plan.price_monthly}`)
      console.log(`      Preço anual: R$ ${plan.price_yearly}`)
      console.log(`      Duração: ${plan.duration_days ? plan.duration_days + ' dias' : 'ILIMITADO'}`)
    }
  }

  // 4. Listar planos criados
  console.log('\n4️⃣ Verificando planos criados...')
  const { data: allPlans, error: listError } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true })

  if (listError) {
    console.log('   ❌ Erro ao listar planos:', listError.message)
  } else {
    console.log('\n📋 PLANOS CONFIGURADOS:\n')
    allPlans.forEach((plan, idx) => {
      console.log(`${idx + 1}. ${plan.display_name}`)
      console.log(`   Nome técnico: ${plan.name}`)
      console.log(`   Descrição: ${plan.description}`)
      console.log(`   Preço mensal: R$ ${plan.price_monthly}`)
      console.log(`   Preço anual: R$ ${plan.price_yearly}`)
      console.log(`   Trial: ${plan.trial_days} dias`)
      console.log(`   Duração: ${plan.duration_days ? plan.duration_days + ' dias' : 'ILIMITADO ♾️'}`)
      console.log(`   Features: ${plan.features.length} itens`)
      console.log(`   Status: ${plan.is_active ? '✅ Ativo' : '❌ Inativo'}`)
      console.log()
    })
  }

  console.log('='  .repeat(60))
  console.log('\n✅ Configuração dos 3 planos concluída!\n')
  console.log('📝 Próximos passos:')
  console.log('   1. Criar página /admin/plans para gerenciar planos')
  console.log('   2. Atualizar /pricing com os 3 planos')
  console.log('   3. Atualizar lógica de subscription-helper.ts')
  console.log()
}

setup3Plans().catch(console.error)
