import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar rate limiting
    const rateLimitCheck = checkRateLimit(email)
    
    if (!rateLimitCheck.allowed) {
      const minutesUntilReset = Math.ceil(rateLimitCheck.timeUntilReset / (1000 * 60))
      
      return NextResponse.json(
        { 
          error: `Muitas tentativas de login. Tente novamente em ${minutesUntilReset} minutos.`,
          rateLimited: true,
          timeUntilReset: rateLimitCheck.timeUntilReset
        },
        { status: 429 }
      )
    }

    // Tentar fazer login
    const { user, error } = await signIn(email, password)

    if (error) {
      console.log(`❌ Login falhado para ${email}:`, error.message)
      
      return NextResponse.json(
        { 
          error: error.message,
          remainingAttempts: rateLimitCheck.remainingAttempts - 1
        },
        { status: 401 }
      )
    }

    if (user) {
      // Login bem-sucedido - resetar rate limit
      resetRateLimit(email)
      console.log(`✅ Login bem-sucedido para ${email}`)
      
      return NextResponse.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      })
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )

  } catch (error) {
    console.error('❌ Erro na API de login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}