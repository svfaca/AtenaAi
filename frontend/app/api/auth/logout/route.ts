import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout realizado com sucesso' },
    { status: 200 }
  )

  // Limpar apenas cookies de autenticação reais
  const secureCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires: new Date(0),
    path: '/'
  }

  const clientCookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires: new Date(0),
    path: '/'
  }

  response.cookies.set('access_token', '', secureCookieOptions)
  response.cookies.set('refresh_token', '', secureCookieOptions)
  response.cookies.set('token', '', secureCookieOptions) // legacy
  response.cookies.set('atena_session_hint', '', clientCookieOptions)

  return response
}
