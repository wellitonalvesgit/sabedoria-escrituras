import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * API de teste simplificada
 * Testa apenas a criação de usuário e envio de email
 * Não depende de cursos ou compras existentes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const userName = name || 'Usuário Teste'
    const supabase = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey
    )

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .maybeSingle()

    let userId: string
    let temporaryPassword: string | null = null
    let isNewUser = false

    if (existingUser) {
      console.log('ℹ️ Usuário já existe:', email)
      userId = existingUser.id
    } else {
      // Criar novo usuário
      console.log('👤 Criando novo usuário:', email)

      temporaryPassword = generateTemporaryPassword()

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          name: userName
        }
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError)
        return NextResponse.json(
          { error: 'Erro ao criar usuário: ' + authError.message },
          { status: 500 }
        )
      }

      console.log('✅ Usuário criado no Auth:', authData.user.id)

      // Criar registro na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          name: userName,
          role: 'student',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (userError) {
        console.error('❌ Erro ao criar usuário na tabela users:', userError)
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { error: 'Erro ao criar registro de usuário: ' + userError.message },
          { status: 500 }
        )
      }

      console.log('✅ Usuário criado na tabela users')
      userId = authData.user.id
      isNewUser = true
    }

    // Enviar email de teste
    if (isNewUser && temporaryPassword) {
      try {
        const { generateNewUserCourseEmailTemplate } = await import('@/lib/email-templates')
        const { sendEmailResend } = await import('@/lib/email-resend')

        const emailTemplate = generateNewUserCourseEmailTemplate(
          userName,
          email,
          temporaryPassword,
          'Curso de Teste - As Cartas de Paulo',
          9.97,
          new Date().toISOString()
        )

        console.log('📧 Enviando email de teste para:', email)

        const emailSent = await sendEmailResend({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        if (emailSent) {
          console.log('✅ Email enviado com sucesso!')
        } else {
          console.error('❌ Falha ao enviar email')
        }

        return NextResponse.json({
          success: true,
          message: 'Usuário criado e email enviado com sucesso',
          user: {
            id: userId,
            name: userName,
            email: email,
            isNew: isNewUser
          },
          credentials: {
            email: email,
            temporaryPassword: temporaryPassword
          },
          email: {
            sent: emailSent,
            to: email,
            subject: emailTemplate.subject
          }
        })
      } catch (error) {
        console.error('❌ Erro ao enviar email:', error)
        return NextResponse.json({
          success: true,
          message: 'Usuário criado mas houve erro ao enviar email',
          user: {
            id: userId,
            name: userName,
            email: email
          },
          credentials: {
            email: email,
            temporaryPassword: temporaryPassword
          },
          email: {
            sent: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        })
      }
    } else {
      return NextResponse.json({
        success: true,
        message: 'Usuário já existe',
        user: {
          id: userId,
          email: email,
          isNew: false
        }
      })
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

function generateTemporaryPassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
