import { NextResponse } from 'next/server'

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
// 🔥 Forçar HTTPS em produção (Railway fornece HTTPS)
if (API_URL.startsWith('http://')) {
  API_URL = API_URL.replace('http://', 'https://')
}

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
    const authorization = req.headers.get('authorization')

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Passar cookies para o backend (autenticação)
    if (cookie) {
      headers['cookie'] = cookie
    }

    // 🔥 Passar Authorization Bearer token se presente (fallback para cookie)
    if (authorization) {
      headers['authorization'] = authorization
    }

    // Preparar body
    let body: BodyInit | undefined = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text()
    }

    // Fazer requisição para o backend
    let backendUrl = `${API_URL}${path}`
    console.log(`[Proxy] ${req.method} ${backendUrl} | auth header: ${!!headers['authorization']} | cookie: ${!!headers['cookie']}`)
    
    // 🔥 CRÍTICO: Não seguir redirects automaticamente (cross-protocol perde Authorization!)
    let backendRes = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
      credentials: 'include',
      redirect: 'manual',
    })

    // 🔄 Tratar redirect 307/308 manualmente, preservando headers de auth
    if (backendRes.status === 307 || backendRes.status === 308) {
      const location = backendRes.headers.get('location')
      if (location) {
        console.log(`[Proxy] Seguindo redirect ${backendRes.status} para: ${location}`)
        backendRes = await fetch(location, {
          method: req.method,
          headers,
          body,
          credentials: 'include',
        })
      }
    }

    console.log(`[Proxy] Resposta: ${backendRes.status} ${backendRes.statusText}`)

    // Ler resposta
    const text = await backendRes.text()
    
    // Log do corpo em caso de erro para diagnóstico
    if (!backendRes.ok) {
      console.error(`[Proxy] ERRO ${backendRes.status}: ${text.substring(0, 200)}`)
    }

    // Construir headers da resposta
    const responseHeaders: Record<string, string> = {
      'Content-Type': backendRes.headers.get('content-type') || 'application/json',
    }

    // 🔥 CRÍTICO: Propagar cookies do backend (access_token, refresh_token)
    // Os route handlers (login, refresh) são responsáveis por recriar os cookies
    // com o domínio correto do frontend. O proxy apenas passa os Set-Cookie adiante.
    let setCookieHeaders: string[]
    try {
      setCookieHeaders = backendRes.headers.getSetCookie?.() ?? []
    } catch {
      setCookieHeaders = []
    }
    
    // Fallback para Node 18 (Vercel)
    if (setCookieHeaders.length === 0) {
      const rawSetCookie = backendRes.headers.get('set-cookie')
      if (rawSetCookie) {
        setCookieHeaders = rawSetCookie.split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_]*=)/)
      }
    }
    
    for (const setCookie of setCookieHeaders) {
      if (!responseHeaders['Set-Cookie']) {
        responseHeaders['Set-Cookie'] = setCookie
      } else {
        responseHeaders['Set-Cookie'] += `, ${setCookie}`
      }
    }

    // Retornar resposta
    return new NextResponse(text, {
      status: backendRes.status,
      headers: responseHeaders,
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

    // Se não for OK, retorna erro como JSON em vez de stream
    if (!backendRes.ok) {
      const errorText = await backendRes.text()
      console.error(`[Proxy Stream] Backend error ${backendRes.status} for ${path}:`, errorText)
      return NextResponse.json(
        { error: `Backend error: ${backendRes.status}`, detail: errorText },
        { status: backendRes.status }
      )
    }

    // 🔥 Propagar cookies de resposta (Set-Cookie) do backend para o navegador
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    const setCookieHeaders = backendRes.headers.getSetCookie?.() ?? []
    for (const setCookie of setCookieHeaders) {
      if (!responseHeaders['Set-Cookie']) {
        responseHeaders['Set-Cookie'] = setCookie
      } else {
        responseHeaders['Set-Cookie'] += `, ${setCookie}`
      }
    }

    // Passar o stream diretamente
    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`[Proxy Stream] Error proxying ${req.method} ${path}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
