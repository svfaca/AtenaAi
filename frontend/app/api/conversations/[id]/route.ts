import { NextRequest } from 'next/server'
import { proxy } from '@/lib/server/proxy'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxy(req, `/api/v1/conversations/${id}`)
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxy(req, `/api/v1/conversations/${id}`)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxy(req, `/api/v1/conversations/${id}`)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxy(req, `/api/v1/conversations/${id}`)
}
