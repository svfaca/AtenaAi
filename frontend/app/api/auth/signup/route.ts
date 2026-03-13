import { NextRequest, NextResponse } from 'next/server'
import { normalizeInterestIds } from '@/lib/constants/interests'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, birthdate, gender, interests } = body

    const normalizedInterests = normalizeInterestIds(interests)

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        full_name: name,
        birth_date: birthdate || null,
        gender: gender || null,
        interests: normalizedInterests,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Backend signup error:', response.status, errorData)

      return NextResponse.json(
        {
          message:
            (typeof errorData?.detail === 'string' && errorData.detail) ||
            (typeof errorData?.message === 'string' && errorData.message) ||
            'Erro ao criar conta',
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const backendUser = data?.user ?? data
    const reactivated = response.headers.get('x-account-reactivated') === 'true'
    const message = reactivated ? 'Conta reativada com sucesso' : 'Conta criada com sucesso'

    // Criar resposta com cookie de autenticação
    const result = NextResponse.json({
      user: {
        id: backendUser?.id || 'unknown',
        email: backendUser?.email || email,
        name: backendUser?.full_name || backendUser?.name || name,
        role: backendUser?.role || 'student',
      },
      message,
      reactivated,
    })

    // Salvar token de acesso em cookie HttpOnly se fornecido
    if (data.access_token) {
      result.cookies.set('access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 horas em segundos
        path: '/',
      })

      result.cookies.set('atena_session_hint', '1', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
    }

    return result
  } catch (error) {
    console.error('Signup error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        message: 'Erro ao processar cadastro: ' + errorMsg,
      },
      { status: 500 }
    )
  }
}
