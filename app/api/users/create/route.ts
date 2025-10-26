import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, generateNewUserEmailTemplate } from '@/lib/email'
import { sendEmailResend, generateSimpleEmailTemplate } from '@/lib/email-resend'

/**
 * Gera senha provisória aleatória de 8 caracteres
 */
function generatePassword(length: number = 8): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%&*'
  const allChars = uppercase + lowercase + numbers + special

  let password = ''

  // Garantir pelo menos 1 de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Preencher o restante aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Cria um novo usuário no sistema
 *
 * POST /api/users/create
 * Body: {
 *   name: string,
 *   email: string,
 *   role: 'student' | 'teacher' | 'admin',
 *   access_days: number,
 *   send_email: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, access_days, send_email } = body

    console.log('🔄 Criando novo usuário...')
    console.log('📝 Dados:', { name, email, role, access_days, send_email })

    // Validar dados obrigatórios
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Nome, email e tipo de usuário são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Criar cliente admin com SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    console.log('🔧 Configuração Supabase:')
    console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada')
    console.log('Service Key:', supabaseServiceRoleKey ? '✅ Configurada' : '❌ Não configurada')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Variáveis de ambiente do Supabase não configuradas')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Gerar senha provisória
    const temporaryPassword = generatePassword(8)
    console.log('🔑 Senha provisória gerada')

    // 1. Criar usuário no Supabase Auth
    console.log('👤 Criando usuário no Auth...')
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError)
      console.error('❌ Detalhes do erro:', JSON.stringify(authError, null, 2))

      // Verificar se é erro de email duplicado
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado no sistema' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Erro ao criar usuário no sistema de autenticação', details: authError.message },
        { status: 500 }
      )
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id)

    // 2. Calcular data de expiração
    const accessExpiresAt = new Date()
    accessExpiresAt.setDate(accessExpiresAt.getDate() + (access_days || 30))

    // 3. Criar usuário na tabela users
    console.log('💾 Criando registro na tabela users...')
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        role,
        status: 'active',
        access_days: access_days || 30,
        access_expires_at: accessExpiresAt.toISOString(),
        allowed_categories: [],
        blocked_categories: [],
        allowed_courses: [],
        blocked_courses: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ Erro ao criar registro do usuário:', userError)
      console.error('❌ Detalhes do erro na tabela users:', JSON.stringify(userError, null, 2))

      // Tentar deletar o usuário do Auth se falhou ao criar na tabela
      try {
        await adminClient.auth.admin.deleteUser(authData.user.id)
        console.log('🗑️ Usuário removido do Auth após erro na tabela')
      } catch (deleteError) {
        console.error('❌ Erro ao deletar usuário do Auth:', deleteError)
      }

      return NextResponse.json(
        { error: 'Erro ao criar registro do usuário', details: userError.message },
        { status: 500 }
      )
    }

    console.log('✅ Registro criado na tabela users')

    // 4. Enviar email com senha (se solicitado)
    let emailSent = false
    if (send_email) {
      console.log('📧 Enviando email com senha provisória...')

      try {
        // Tentar primeiro com Supabase Edge Function
        const emailTemplate = generateNewUserEmailTemplate(
          name,
          email,
          temporaryPassword,
          access_days || 30
        )

        emailSent = await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        // Se falhou, tentar com Resend como fallback
        if (!emailSent && process.env.RESEND_API_KEY) {
          console.log('🔄 Tentando envio via Resend como fallback...')
          
          const simpleTemplate = generateSimpleEmailTemplate(
            name,
            email,
            temporaryPassword,
            access_days || 30
          )

          emailSent = await sendEmailResend({
            to: email,
            subject: simpleTemplate.subject,
            html: simpleTemplate.html,
            text: simpleTemplate.text
          })
        }

        if (emailSent) {
          console.log('✅ Email enviado com sucesso para:', email)
        } else {
          console.log('❌ Falha ao enviar email para:', email)
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email:', emailError)
        // Não falhar a criação do usuário por causa do email
      }
    }

    console.log('✅ Usuário criado com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      },
      temporary_password: temporaryPassword,
      email_sent: emailSent
    })

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar usuário' },
      { status: 500 }
    )
  }
}
