import { NextRequest } from 'next/server'
import { proxy, proxyStream } from '@/lib/server/proxy'

type RouteContext = {
  params: {
    path: string[]
  }
}

function buildBackendPath(request: NextRequest, path: string[]) {
  const search = new URL(request.url).search
  return `/api/v1/${path.join('/')}${search}`
}

async function handle(request: NextRequest, context: RouteContext) {
  const backendPath = buildBackendPath(request, context.params.path)
  const acceptsStream = request.headers.get('accept')?.includes('text/event-stream')

  if (acceptsStream) {
    return proxyStream(request, backendPath)
  }

  return proxy(request, backendPath)
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}
