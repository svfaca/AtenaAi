import { NextRequest } from 'next/server'
import { proxy } from '@/lib/server/proxy'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxy(req, `/api/v1/conversations/${id}/duplicate`)
}
