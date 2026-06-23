import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/lib/server/proxy'

export async function DELETE(req: NextRequest) {
  try {
    return proxy(req, '/api/v1/users/me')
  } catch (error) {
    console.error('[/api/user/delete] Error:', error)
    return NextResponse.json({ error: 'Erro ao deletar conta' }, { status: 500 })
  }
}
