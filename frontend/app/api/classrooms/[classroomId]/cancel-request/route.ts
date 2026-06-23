import { proxy } from '@/lib/server/proxy'

export async function DELETE(
  req: Request,
  context: { params: Promise<{ classroomId: string }> }
) {
  const { classroomId } = await context.params
  return proxy(req, `/api/v1/classrooms/${classroomId}/cancel-request`)
}
