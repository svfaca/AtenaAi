import { proxy } from '@/lib/server/proxy'

export async function GET(req: Request) {
  return proxy(req, '/api/v1/conversations')
}

export async function POST(req: Request) {
  return proxy(req, '/api/v1/conversations')
}
