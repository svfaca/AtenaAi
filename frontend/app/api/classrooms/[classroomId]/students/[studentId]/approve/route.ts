import { proxy } from '@/lib/server/proxy'

export async function POST(
  req: Request,
  context: { params: Promise<{ classroomId: string; studentId: string }> }
) {
  const { classroomId, studentId } = await context.params
  return proxy(req, `/api/v1/classrooms/${classroomId}/students/${studentId}/approve`)
}
