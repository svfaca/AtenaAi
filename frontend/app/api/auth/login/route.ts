import { NextRequest, NextResponse } from 'next/server'
import type { LoginRequest } from '@/lib/types/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

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
    }

    // Extrair tokens do Set-Cookie do backend
    const setCookieHeaders = response.headers.getSetCookie?.() ?? []
    for (const setCookie of setCookieHeaders) {
      // Parsear o cookie para extrair nome e valor
      const match = setCookie.match(/^([^=]+)=([^;]+)/)
      if (match) {
        const [, key, value] = match
        if (key === 'access_token' || key === 'refresh_token') {
          // Recriar o cookie SEM domain para usar o domínio do frontend
          result.cookies.set(key, value, cookieOptions)
        } else {
          // Para outros cookies, manter o original
          result.headers.append('Set-Cookie', setCookie)
        }
      } else {
        result.headers.append('Set-Cookie', setCookie)
      }
    }

    return result
  } catch (error) {
    console.error('[Auth/Login] Error:', error)
    return NextResponse.json(
      { message: 'Servico de autenticacao indisponivel no momento' },
      { status: 502 }
    )
  }
}
