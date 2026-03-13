import { proxy } from '@/lib/server/proxy'

export async function GET(req: Request) {
  return proxy(req, '/api/v1/auth/me')
}

