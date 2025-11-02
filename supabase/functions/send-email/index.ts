import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
}

Deno.serve(async (req: Request) => {
  try {
    const { to, subject, html, text }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'to, subject e html são obrigatórios' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('📧 Enviando email para:', to)
    console.log('📝 Assunto:', subject)

    // Usar o serviço de email do Supabase
    const { data, error } = await fetch('https://api.supabase.com/v1/projects/aqvqpkmjdtzeoclndwhj/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      },
      body: JSON.stringify({
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      })
    })

    if (error) {
      console.error('❌ Erro ao enviar email:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar email', details: error }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Email enviado com sucesso')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso',
        data 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro na função send-email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
