import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

/**
 * Proxy universal para comunicação com backend
 * Evita repetição de código e gerencia automaticamente:
 * - Cookies/autenticação
 * - Headers
 * - Tratamento de erros
 */
export async function proxy(req: Request, path: string) {
  try {
    const cookie = req.headers.get('cookie')

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Passar cookies para o backend (autenticação)
    if (cookie) {
      headers['cookie'] = cookie
    }

    // Preparar body
    let body: BodyInit | undefined = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text()
    }

    // Fazer requisição para o backend
    const backendRes = await fetch(`${API_URL}${path}`, {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    })

    // Ler resposta
    const text = await backendRes.text()

    // Retornar resposta
    return new NextResponse(text, {
      status: backendRes.status,
      headers: {
        'Content-Type': backendRes.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    console.error(`[Proxy] Error proxying ${req.method} ${path}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Proxy para streaming (Server-Sent Events)
 * Mantém a conexão aberta e passa o stream diretamente
 */
export async function proxyStream(req: Request, path: string) {
  try {
    const cookie = req.headers.get('cookie')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (cookie) {
      headers['cookie'] = cookie
    }

    let body: BodyInit | undefined = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text()
    }

    const backendRes = await fetch(`${API_URL}${path}`, {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    })

    // Passar o stream diretamente
    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error(`[Proxy Stream] Error proxying ${req.method} ${path}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
