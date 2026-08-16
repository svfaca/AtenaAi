import { NextRequest, NextResponse } from 'next/server'

// 🔥 Forçar HTTPS em produção
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-110f3.up.railway.app'
if (API_URL.startsWith('http://')) {
  API_URL = API_URL.replace('http://', 'https://')
}

export async function POST(request: NextRequest) {
  try {
    // Passar cookies do request original para o backend
    const cookie = request.headers.get('cookie')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (cookie) {
      headers['cookie'] = cookie
    }

    console.log('[Auth/Refresh] Enviando refresh para backend, cookie presente:', !!cookie)

    const backendRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
    })

    const rawText = await backendRes.text()
    let data: any = {}
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch {
      data = {}
    }

    if (!backendRes.ok) {
      console.error('[Auth/Refresh] Backend retornou erro:', backendRes.status, rawText)
      return NextResponse.json(
        { error: data.detail || 'Falha ao renovar token' },
        { status: backendRes.status }
      )
    }

    // 🔥 Extrair tokens do Set-Cookie do backend
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
    
    let accessTokenFromCookie: string | null = null
    let refreshTokenFromCookie: string | null = null
    for (const setCookie of setCookieHeaders) {
      const match = setCookie.match(/^([^=]+)=([^;]+)/)
      if (match) {
        const [, key, value] = match
        if (key === 'access_token') {
          accessTokenFromCookie = value
        } else if (key === 'refresh_token') {
          refreshTokenFromCookie = value
        }
      }
    }

    // 🔒 SEGURANÇA (V5): o backend NÃO retorna mais o token no body.
    // O token é obtido apenas do Set-Cookie do backend (cookie HttpOnly).

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    }

    const result = NextResponse.json(
      {
        message: 'Token renovado com sucesso',
        user: data.user,
      },
      { status: 200 }
    )

    // Recriar cookies para o domínio do frontend
    const cookieTokenValue = accessTokenFromCookie
    if (cookieTokenValue) {
      result.cookies.set('access_token', cookieTokenValue, cookieOptions)
      console.log('[Auth/Refresh] Cookie access_token recriado com sucesso')
    }
    
    const cookieRefreshValue = refreshTokenFromCookie
    if (cookieRefreshValue) {
      result.cookies.set('refresh_token', cookieRefreshValue, {
        ...cookieOptions,
        maxAge: 14 * 24 * 60 * 60,
      })
      console.log('[Auth/Refresh] Cookie refresh_token recriado com sucesso')
    }

    return result
  } catch (error) {
    console.error('[Auth/Refresh] Error:', error)
    return NextResponse.json(
      { error: 'Serviço de autenticação indisponível' },
      { status: 502 }
    )
  }
}
