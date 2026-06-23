import { NextRequest, NextResponse } from 'next/server'
import { proxyStream } from '@/lib/server/proxy'

const MAX_HISTORY = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, message, conversationId, history, language, session_id } = body

    // Normalizar mensagens
    const normalizedMessages = Array.isArray(messages)
      ? messages
          .filter((item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant'))
          .map((item) => ({ role: item.role, content: String(item.content) }))
      : []

    const lastUserMessage = [...normalizedMessages].reverse().find((item) => item.role === 'user')
    const fallbackMessage = typeof message === 'string' ? message : ''
    const currentMessage = lastUserMessage?.content || fallbackMessage

    if (!currentMessage || !String(currentMessage).trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      )
    }

    const payloadMessages = normalizedMessages.length
      ? normalizedMessages.slice(-MAX_HISTORY)
      : [
          ...((Array.isArray(history) ? history : []).filter(
            (item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant')
          )),
          { role: 'user', content: currentMessage },
        ].slice(-MAX_HISTORY)

    // Criar novo request para o proxy com o payload normalizado
    const proxyRequest = new NextRequest(request, {
      body: JSON.stringify({
        message: currentMessage,
        messages: payloadMessages,
        language: language || 'pt-BR',
        conversation_id: conversationId,
        history: payloadMessages.slice(0, -1),
        session_id,
      }),
    })

    return proxyStream(proxyRequest, '/api/v1/chat/stream')
  } catch (error) {
    console.error('Erro no endpoint de stream público:', error)
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar o stream. Tente novamente.' },
      { status: 500 }
    )
  }
}
