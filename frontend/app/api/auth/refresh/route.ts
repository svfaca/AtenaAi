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

  // 🔥 CRÍTICO: Propagar cookies do backend (access_token e refresh_token)
  const setCookieHeaders = response.headers.getSetCookie?.() ?? []
  for (const setCookie of setCookieHeaders) {
    result.headers.append('Set-Cookie', setCookie)
  }

  return result
}
