import { NextRequest } from 'next/server'
import { proxyStream } from '@/lib/server/proxy'

export async function POST(request: NextRequest) {
  return proxyStream(request, '/api/v1/chat/stream')
}
