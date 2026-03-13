import { NextRequest } from 'next/server'
import { proxyStream } from '@/lib/server/proxy'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxyStream(req, `/api/v1/conversations/${id}/messages/stream`)
}
