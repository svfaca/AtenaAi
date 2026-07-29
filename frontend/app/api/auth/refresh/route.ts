import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

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

    const backendRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
    })

    const data = await backendRes.json()

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.detail || 'Falha ao renovar token' },
        { status: backendRes.status }
      )
    }

    // 🔥 CRÍTICO: Recriar cookies de autenticação para o domínio do frontend
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    }

    // 🔥 Extrair tokens do Set-Cookie do backend
    // Usar getSetCookie() se disponível (Node 19+), fallback para get('set-cookie')
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

    const result = NextResponse.json(
      {
        message: 'Token renovado com sucesso',
        user: data.user,
        // 🔥 Retornar novo access_token para o frontend armazenar em memória
        access_token: accessTokenFromCookie,
      },
      { status: 200 }
    )

    // Recriar cookies para o domínio do frontend
    if (accessTokenFromCookie) {
      result.cookies.set('access_token', accessTokenFromCookie, cookieOptions)
    }
    if (refreshTokenFromCookie) {
      result.cookies.set('refresh_token', refreshTokenFromCookie, cookieOptions)
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
