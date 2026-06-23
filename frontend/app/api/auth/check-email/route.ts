import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json(
        { available: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_URL}/api/v1/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const rawData = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (typeof rawData?.detail === 'string' && rawData.detail) ||
        (typeof rawData?.message === 'string' && rawData.message) ||
        'Error checking email availability'

      return NextResponse.json(
        { available: false, reactivatable: false, message },
        { status: response.status }
      )
    }

    const available = typeof rawData?.available === 'boolean' ? rawData.available : false
    const reactivatable =
      typeof rawData?.reactivatable === 'boolean' ? rawData.reactivatable : false
    const message =
      (typeof rawData?.message === 'string' && rawData.message) ||
      (available ? 'Email disponível!' : 'Este email já está cadastrado')

    return NextResponse.json({ available, reactivatable, message })
  } catch (error) {
    console.error('[Auth/CheckEmail] Error:', error)
    return NextResponse.json(
      { available: false, reactivatable: false, message: 'Error checking email' },
      { status: 500 }
    )
  }
}