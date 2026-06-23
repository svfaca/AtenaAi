import { NextRequest, NextResponse } from 'next/server'
import type { LoginRequest } from '@/lib/types/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

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

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.detail || 'Falha ao fazer login' },
        { status: response.status }
      )
    }

    const data = await response.json()

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

    // Cookie de dica de sessão
    result.cookies.set('atena_session_hint', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    // Copiar Set-Cookie do backend
    const setCookieHeaders = response.headers.getSetCookie?.() ?? []
    for (const setCookie of setCookieHeaders) {
      result.headers.append('Set-Cookie', setCookie)
    }

    return result
  } catch (error) {
    console.error('[Auth/Login] Error:', error)
    return NextResponse.json(
      { message: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
