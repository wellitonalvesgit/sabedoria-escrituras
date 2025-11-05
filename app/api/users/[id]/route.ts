import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// GET /api/users/[id] - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey

    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { data: user, error } = await client
      .from('users')
      .select(`
        *,
        subscriptions (
          id,
          plan_id,
          status,
          plan_expires_at,
          subscription_plans (
            id,
            name,
            plan_type,
            duration_days
          )
        ),
        user_course_purchases (
          id,
          course_id,
          payment_status,
          is_active
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de busca de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log('🔄 Atualizando usuário:', id)
    console.log('📝 Dados recebidos:', body)

    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey

    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { name, email, role, status, access_days, allowed_courses, blocked_courses, manual_access } = body

    // Calcular data de expiração
    const accessExpiresAt = new Date()
    accessExpiresAt.setDate(accessExpiresAt.getDate() + (access_days || 30))

    console.log('📅 Calculando data de expiração...')
    console.log('   access_days:', access_days)
    console.log('   accessExpiresAt:', accessExpiresAt.toISOString())

    const updateData = {
      name,
      email,
      role,
      status,
      access_days: access_days || 30,
      access_expires_at: accessExpiresAt.toISOString(),
      allowed_courses: allowed_courses || [],
      blocked_courses: blocked_courses || [],
      updated_at: new Date().toISOString()
    }

    console.log('💾 Dados a salvar:', updateData)

    const { data: user, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
      return NextResponse.json({ error: 'Erro ao atualizar usuário', details: error }, { status: 500 })
    }

    console.log('✅ Usuário atualizado com sucesso:', user)

    // Processar liberação manual de acesso
    if (manual_access) {
      // Buscar planos
      const { data: plans } = await client
        .from('subscription_plans')
        .select('id, name, plan_type, duration_days')
        .in('plan_type', ['basic', 'premium'])

      const basicPlan = plans?.find((p: any) => p.plan_type === 'basic')
      const premiumPlan = plans?.find((p: any) => p.plan_type === 'premium')

      // Processar plano Básico
      if (manual_access.hasBasic && basicPlan) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (basicPlan.duration_days || 60))
        
        // Verificar se já existe subscription ativa
        const { data: existingBasic } = await client
          .from('subscriptions')
          .select('id')
          .eq('user_id', id)
          .eq('plan_id', basicPlan.id)
          .eq('status', 'active')
          .maybeSingle()

        if (existingBasic) {
          // Atualizar subscription existente
          await client
            .from('subscriptions')
            .update({
              status: 'active',
              plan_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBasic.id)
        } else {
          // Criar nova subscription
          await client
            .from('subscriptions')
            .insert({
              user_id: id,
              plan_id: basicPlan.id,
              status: 'active',
              plan_expires_at: expiresAt.toISOString()
            })
        }
      } else if (!manual_access.hasBasic && basicPlan) {
        // Desativar subscription básica
        await client
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', id)
          .eq('plan_id', basicPlan.id)
          .eq('status', 'active')
      }

      // Processar plano Premium
      if (manual_access.hasPremium && premiumPlan) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (premiumPlan.duration_days || 365))
        
        // Verificar se já existe subscription ativa
        const { data: existingPremium } = await client
          .from('subscriptions')
          .select('id')
          .eq('user_id', id)
          .eq('plan_id', premiumPlan.id)
          .eq('status', 'active')
          .maybeSingle()

        if (existingPremium) {
          // Atualizar subscription existente
          await client
            .from('subscriptions')
            .update({
              status: 'active',
              plan_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPremium.id)
        } else {
          // Criar nova subscription
          await client
            .from('subscriptions')
            .insert({
              user_id: id,
              plan_id: premiumPlan.id,
              status: 'active',
              plan_expires_at: expiresAt.toISOString()
            })
        }
      } else if (!manual_access.hasPremium && premiumPlan) {
        // Desativar subscription premium
        await client
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', id)
          .eq('plan_id', premiumPlan.id)
          .eq('status', 'active')
      }

      // Processar cursos do Arsenal Espiritual
      const arsenalCourses = [
        '3d65d963-d3b8-4d42-a312-e82a73a1f563', // Estudo do Apocalipse
        '742aba61-0125-4fb8-8a63-d7bf500fc445', // Mulher Cristã
        'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb', // Pregador Premium
        '189a4f75-5aa6-4d6c-a74e-cede5cd47862'  // Unção do Leão
      ]

      for (const courseId of arsenalCourses) {
        const isActive = manual_access.arsenalEspiritual?.[courseId] === true
        
        // Verificar se já existe purchase
        const { data: existingPurchase } = await client
          .from('user_course_purchases')
          .select('id')
          .eq('user_id', id)
          .eq('course_id', courseId)
          .maybeSingle()

        if (isActive) {
          if (existingPurchase) {
            // Atualizar purchase existente
            await client
              .from('user_course_purchases')
              .update({
                payment_status: 'completed',
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPurchase.id)
          } else {
            // Criar nova purchase
            await client
              .from('user_course_purchases')
              .insert({
                user_id: id,
                course_id: courseId,
                payment_status: 'completed',
                is_active: true,
                purchase_date: new Date().toISOString()
              })
          }
        } else if (existingPurchase) {
          // Desativar purchase
          await client
            .from('user_course_purchases')
            .update({
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPurchase.id)
        }
      }
    }

    // Buscar dados atualizados do usuário
    const { data: updatedUser } = await client
      .from('users')
      .select(`
        *,
        subscriptions (
          id,
          plan_id,
          status,
          plan_expires_at,
          subscription_plans (
            id,
            name,
            plan_type,
            duration_days
          )
        ),
        user_course_purchases (
          id,
          course_id,
          payment_status,
          is_active
        )
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Erro na API de atualização de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey

    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar usuário:', error)
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de exclusão de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}