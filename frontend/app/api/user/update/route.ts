import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-110f3.up.railway.app'

async function updateProfile(req: NextRequest) {
  const formData = await req.formData()
  const cookieHeader = req.headers.get('cookie')

  const response = await fetch(`${API_URL}/api/v1/auth/update-profile`, {
    method: 'PUT',
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data, { status: 200 })
}

export async function PUT(req: NextRequest) {
  try {
    return await updateProfile(req)
  } catch (error) {
    console.error('[/api/user/update] Error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    return await updateProfile(req)
  } catch (error) {
    console.error('[/api/user/update] Error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
