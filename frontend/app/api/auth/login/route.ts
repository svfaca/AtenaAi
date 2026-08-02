import { NextRequest, NextResponse } from 'next/server'
import type { LoginRequest } from '@/lib/types/auth'

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
// 🔥 Forçar HTTPS em produção (Railway fornece HTTPS)
if (API_URL.startsWith('http://')) {
  API_URL = API_URL.replace('http://', 'https://')
}

async function parseBackendResponse(response: Response): Promise<{ data: any; rawText: string }> {
  const rawText = await response.text()
  if (!rawText) {
    return { data: null, rawText: '' }
  }

  try {
    return { data: JSON.parse(rawText), rawText }
  } catch {
    return { data: null, rawText }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const normalizedEmail = body.email?.trim().toLowerCase()

    if (!normalizedEmail || !body.password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Enviar como form-data para OAuth2PasswordRequestForm
    const formData = new URLSearchParams()
    formData.append('username', normalizedEmail)
    formData.append('password', body.password)

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      credentials: 'include',
    })

    const { data, rawText } = await parseBackendResponse(response)

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.detail ||
            data?.message ||
            rawText ||
            'Falha ao fazer login',
        },
        { status: response.status }
      )
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Resposta invalida do servidor de autenticacao' },
        { status: 502 }
      )
    }

    const backendUser = data?.user || {}
    const profileImage = backendUser.profile_image || backendUser.avatar_url || null

    // 🔥 Extrair tokens do Set-Cookie do backend
    // Usar getSetCookie() se disponível (Node 19+), fallback para get('set-cookie')
    let setCookieHeaders: string[]
    try {
      setCookieHeaders = response.headers.getSetCookie?.() ?? []
    } catch {
      setCookieHeaders = []
    }
    
    // Fallback para Node 18 (Vercel): parsear manualmente o header Set-Cookie
    if (setCookieHeaders.length === 0) {
      const rawSetCookie = response.headers.get('set-cookie')
      if (rawSetCookie) {
        // Split por vírgula, mas cuidado com valores que contêm vírgula
        setCookieHeaders = rawSetCookie.split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_]*=)/)
      }
    }
    
    console.log('[Auth/Login] Set-Cookie headers from backend:', setCookieHeaders)
    
    let accessTokenFromCookie: string | null = null
    let refreshTokenValue: string | null = null

    for (const setCookie of setCookieHeaders) {
      // Parsear o cookie para extrair nome e valor
      const match = setCookie.match(/^([^=]+)=([^;]+)/)
      if (match) {
        const [, key, value] = match
        if (key === 'access_token') {
          accessTokenFromCookie = value
        } else if (key === 'refresh_token') {
          refreshTokenValue = value
        }
      }
    }

    // 🔥 Usar access_token do body do backend (mais confiável que parsear Set-Cookie)
    const accessTokenFromBody = data.access_token || null
    // 🔥 Token final: prioridade para body (sempre presente), fallback para cookie parseado
    const finalAccessToken = accessTokenFromBody || accessTokenFromCookie
    
    const result = NextResponse.json({
      user: {
        ...backendUser,
        id: backendUser.id || 'unknown',
        email: backendUser.email || normalizedEmail,
        full_name: backendUser.full_name || backendUser.name || 'Usuario',
        name: backendUser.full_name || backendUser.name || 'Usuario',
        role: backendUser.role || 'student',
        profile_image: profileImage,
      },
      message: data.message || 'Login realizado com sucesso',
      // 🔥 Token no body para fallback em memória (prioridade: body > cookie)
      access_token: finalAccessToken,
    })

    // 🔥 CRÍTICO: Recriar cookies de autenticação para o domínio do frontend
    // Não podemos copiar cegamente os Set-Cookie do backend porque:
    // 1. Backend pode estar em domínio diferente (ex: Render)
    // 2. Cookies com domain do backend não são enviados pelo navegador para o frontend
    // 3. Precisamos definir os cookies SEM domain para usar o domínio atual (Vercel)
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      // 🔒 NÃO definir domain - deixa o browser usar o domínio atual automaticamente
    }

    // 🔥 Usar o token do body (mais confiável) para setar o cookie
    // Fallback para o valor parseado do Set-Cookie se o body não tiver token
    const cookieTokenValue = accessTokenFromBody || accessTokenFromCookie
    if (cookieTokenValue) {
      result.cookies.set('access_token', cookieTokenValue, cookieOptions)
      console.log('[Auth/Login] Cookie access_token definido com sucesso')
    } else {
      console.error('[Auth/Login] ERRO: Nenhum token disponível para definir cookie!')
    }
    
    const cookieRefreshValue = data.refresh_token || refreshTokenValue
    if (cookieRefreshValue) {
      result.cookies.set('refresh_token', cookieRefreshValue, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60, // 7 dias
      })
      console.log('[Auth/Login] Cookie refresh_token definido com sucesso')
    } else if (refreshTokenValue) {
      result.cookies.set('refresh_token', refreshTokenValue, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60,
      })
    } else {
      console.warn('[Auth/Login] Aviso: refresh_token não encontrado')
    }

    console.log('[Auth/Login] access_token set:', !!accessTokenFromCookie, 'refresh_token set:', !!refreshTokenValue)

    return result
  } catch (error) {
    console.error('[Auth/Login] Error:', error)
    return NextResponse.json(
      { message: 'Servico de autenticacao indisponivel no momento' },
      { status: 502 }
    )
  }
}
