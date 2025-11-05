import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'
import { generateCoursePurchaseEmailTemplate } from '@/lib/email-templates'
import { sendEmailResend } from '@/lib/email-resend'

/**
 * Rota de teste para simular compra de curso e envio de email
 * 
 * Uso:
 * POST /api/test-course-purchase
 * Body: {
 *   userId: string (opcional - usa o primeiro usuário se não informado)
 *   courseId: string (opcional - usa o primeiro curso do Arsenal se não informado)
 *   email: string (opcional - usa o email do usuário se não informado)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId, email } = body

    const supabase = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey
    )

    // Buscar usuário
    let userData
    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single()
      userData = data
    } else {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .limit(1)
        .single()
      userData = data
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar curso do Arsenal Espiritual
    let courseData
    if (courseId) {
      const { data } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('id', courseId)
        .single()
      courseData = data
    } else {
      const { data } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('id', (
          await supabase
            .from('course_categories')
            .select('course_id')
            .eq('category_id', (
              await supabase
                .from('categories')
                .select('id')
                .eq('slug', 'arsenal-espiritual')
                .single()
            ).data?.id)
            .limit(1)
            .single()
        ).data?.course_id)
        .single()
      courseData = data
    }

    if (!courseData) {
      return NextResponse.json(
        { error: 'Curso não encontrado' },
        { status: 404 }
      )
    }

    // Criar registro de compra de teste
    const { data: purchase, error: purchaseError } = await supabase
      .from('user_course_purchases')
      .insert({
        user_id: userData.id,
        course_id: courseData.id,
        payment_status: 'completed',
        payment_id: `test-${Date.now()}`,
        amount: courseData.price || 9.97,
        currency: 'BRL',
        is_active: true,
        expires_at: null
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Erro ao criar compra de teste:', purchaseError)
      return NextResponse.json(
        { error: 'Erro ao criar compra de teste' },
        { status: 500 }
      )
    }

    // Enviar email de teste
    const emailTo = email || userData.email
    const emailTemplate = generateCoursePurchaseEmailTemplate(
      userData.name,
      courseData.title,
      Number(courseData.price || 9.97),
      new Date().toISOString()
    )

    const emailSent = await sendEmailResend({
      to: emailTo,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })

    return NextResponse.json({
      success: true,
      message: 'Compra de teste criada e email enviado',
      purchase: {
        id: purchase.id,
        user: userData.name,
        course: courseData.title,
        amount: courseData.price || 9.97
      },
      email: {
        sent: emailSent,
        to: emailTo,
        subject: emailTemplate.subject
      }
    })
  } catch (error) {
    console.error('Erro no teste de compra:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

