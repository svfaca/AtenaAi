import { NextRequest } from 'next/server'
import { proxy } from '@/lib/server/proxy'

export async function POST(request: NextRequest) {
  return proxy(request, '/api/v1/chat')
}
}
