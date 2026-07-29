import { proxy } from '@/lib/server/proxy'

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie')
  const authorization = req.headers.get('authorization')
  console.log('[Conversations/GET] cookie:', !!cookie, 'authorization:', !!authorization)
  return proxy(req, '/api/v1/conversations')
}

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie')
  const authorization = req.headers.get('authorization')
  console.log('[Conversations/POST] cookie:', !!cookie, 'authorization:', !!authorization)
  return proxy(req, '/api/v1/conversations')
}
