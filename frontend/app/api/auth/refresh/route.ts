import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/lib/server/proxy'

export async function POST(request: NextRequest) {
  const response = await proxy(request, '/api/v1/auth/refresh')

  if (!response.ok) {
    return response
  }

  const data = await response.json()
  
  const result = NextResponse.json(
    {
      message: 'Token renovado com sucesso',
      user: data.user,
    },
    { status: 200 }
  )

  // 🔥 CRÍTICO: Recriar cookies de autenticação para o domínio do frontend
  // Não podemos copiar cegamente os Set-Cookie do backend porque
  // cookies com domain do backend não são enviados pelo navegador para o frontend
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  }

  const setCookieHeaders = response.headers.getSetCookie?.() ?? []
  for (const setCookie of setCookieHeaders) {
    const match = setCookie.match(/^([^=]+)=([^;]+)/)
    if (match) {
      const [, key, value] = match
      if (key === 'access_token' || key === 'refresh_token') {
        // Recriar o cookie SEM domain para usar o domínio do frontend
        result.cookies.set(key, value, cookieOptions)
      } else {
        result.headers.append('Set-Cookie', setCookie)
      }
    } else {
      result.headers.append('Set-Cookie', setCookie)
    }
  }

  return result
}
