import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/lib/server/proxy'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie')

    // Get user info to determine endpoint
    const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { cookie: cookieHeader }),
      },
      credentials: 'include',
    })

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await userRes.json()

    if (!user || !user.role) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 500 })
    }

    // Choose endpoint based on role
    const endpoint = user.role === 'teacher' ? '/api/v1/classrooms' : '/api/v1/classrooms/my'

    return proxy(req, endpoint)
  } catch (error) {
    console.error('Error fetching classrooms:', error)
    return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return proxy(req, '/api/v1/classrooms')
}
