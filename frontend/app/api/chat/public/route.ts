import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/lib/server/proxy'

const MAX_HISTORY = 10

type RateLimitHeaders = {
  remaining: number | null
  resetInSeconds: number | null
}

function readRateLimitHeaders(response: Response): RateLimitHeaders {
  const remainingRaw = response.headers.get('x-ratelimit-remaining')
  const resetRaw = response.headers.get('x-ratelimit-reset')

  const remaining = remainingRaw !== null ? Number(remainingRaw) : null
  const resetInSeconds = resetRaw !== null ? Number(resetRaw) : null

  return {
    remaining: Number.isFinite(remaining) ? remaining : null,
    resetInSeconds: Number.isFinite(resetInSeconds) ? resetInSeconds : null,
  }
}

function withRateHeaders(base: HeadersInit | undefined, rate: RateLimitHeaders): Headers {
  const headers = new Headers(base)

  if (rate.remaining !== null) {
    headers.set('X-RateLimit-Remaining', String(rate.remaining))
  }

  if (rate.resetInSeconds !== null) {
    headers.set('X-RateLimit-Reset', String(rate.resetInSeconds))
  }

  return headers
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, message, text, conversationId, history, language, session_id } = body

    // Normalize messages
    const normalizedMessages = Array.isArray(messages)
      ? messages
          .filter((item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant'))
          .map((item) => ({ role: item.role, content: String(item.content) }))
      : []

    const lastUserMessage = [...normalizedMessages].reverse().find((item) => item.role === 'user')
    const fallbackMessage = typeof text === 'string' ? text : typeof message === 'string' ? message : ''
    const currentMessage = lastUserMessage?.content || fallbackMessage

    if (!currentMessage || !String(currentMessage).trim()) {
      return NextResponse.json({ error: 'Mensagem não pode estar vazia' }, { status: 400 })
    }

    const payloadMessages = normalizedMessages.length
      ? normalizedMessages.slice(-MAX_HISTORY)
      : [
          ...((Array.isArray(history) ? history : []).filter(
            (item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant')
          )),
          { role: 'user', content: currentMessage },
        ].slice(-MAX_HISTORY)

    // 🔥 CRÍTICO: Não clonar o `request` recebido via `new NextRequest(request, ...)`.
    // O construtor tenta ler o private field `#state` do request de entrada (classe
    // interna do Next), lançando "Cannot read private member #state from an object
    // whose class did not declare it" no runtime Node. Construir a partir da URL +
    // init explícito evita ler o estado privado do request original.
    const proxyRequest = new NextRequest(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: JSON.stringify({
        messages: payloadMessages,
        content: currentMessage,
        language: language || 'pt-BR',
        conversation_id: conversationId,
        history: payloadMessages.slice(0, -1),
        session_id,
      }),
    })

    const response = await proxy(proxyRequest, '/api/v1/chat/')
    const rate = readRateLimitHeaders(response)

    // Extract data from response
    const data = await response.json()

    return NextResponse.json(
      {
        response: data.reply || data.response || data.message || 'Mensagem recebida',
        conversationId: data.conversation_id || conversationId,
        remaining: rate.remaining,
        resetInSeconds: rate.resetInSeconds,
      },
      {
        headers: withRateHeaders(undefined, rate),
      }
    )
  } catch (error) {
    console.error('[Chat Público] Error:', error)
    return NextResponse.json({ error: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.' }, { status: 500 })
  }
}
