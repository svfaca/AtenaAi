'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth'

type TeacherDashboardResponse = {
  total_classrooms?: number
  total_students?: number
  total_messages?: number
  reports_today?: number
}

type TeacherStudentApi = {
  id: number
  full_name?: string
  profile_image?: string | null
  classroom_id?: number
  classroom_ids?: number[]
  classroom_name?: string
  last_activity?: string | null
}

type TeacherStudentsResponse = {
  items?: TeacherStudentApi[]
  total?: number
}

type TeacherClassroomApi = {
  id: number
  name?: string
  classroom_code?: string
  code?: string
  student_count?: number
  pending_students?: Array<{ id: number; full_name?: string; email?: string }>
  students?: Array<{ id: number; full_name?: string; email?: string }>
}

type TeacherClassroomsResponse =
  | TeacherClassroomApi[]
  | {
      items?: TeacherClassroomApi[]
      total?: number
      skip?: number
      limit?: number
      has_more?: boolean
    }

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function useTeacherDashboard() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'

  const {
    data: classrooms,
    error: classroomsError,
    isLoading: classroomsLoading,
    mutate: mutateClassrooms,
  } = useSWR(
    isTeacher ? '/api/classrooms' : null,
    (url) => api<TeacherClassroomsResponse>(url),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: dashboard,
    error: dashboardError,
    isLoading: dashboardLoading,
  } = useSWR(
    isTeacher ? '/api/teacher/dashboard' : null,
    (url) => api<TeacherDashboardResponse>(url),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const {
    data: studentsResponse,
    error: studentsError,
    isLoading: studentsLoading,
  } = useSWR(
    isTeacher ? '/api/teacher/students' : null,
    (url) => api<TeacherStudentsResponse>(url),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  )

  const classroomList = Array.isArray(classrooms)
    ? classrooms
    : Array.isArray(classrooms?.items)
      ? classrooms.items
      : []
  const studentList = Array.isArray(studentsResponse?.items) ? studentsResponse.items : []

  const totalPendingRequests = classroomList.reduce((acc, room) => {
    const pending = Array.isArray(room.pending_students) ? room.pending_students.length : 0
    return acc + pending
  }, 0)

  const normalizedClassrooms = classroomList.map((room) => ({
    id: String(room.id),
    name: room.name || 'Turma sem nome',
    code: room.classroom_code || room.code || `TURMA-${room.id}`,
    students: Number(room.student_count || 0),
    pendingRequests: Array.isArray(room.pending_students) ? room.pending_students.length : 0,
    approvedStudents: Array.isArray(room.students)
      ? room.students.map((student) => ({
          id: String(student.id),
          name: student.full_name || 'Aluno',
          email: student.email || '',
        }))
      : [],
    pendingStudents: Array.isArray(room.pending_students)
      ? room.pending_students.map((student) => ({
          id: String(student.id),
          name: student.full_name || 'Aluno',
          email: student.email || '',
        }))
      : [],
  }))

  const normalizedStudents = studentList.map((student) => {
    const name = student.full_name || 'Aluno'
    return {
      id: String(student.id),
      name,
      classroom: student.classroom_name || 'Sem turma',
      initials: toInitials(name),
      profileImage: student.profile_image || null,
    }
  })

  const stats = [
    {
      id: 'classrooms',
      label: 'Total de Turmas',
      value: Number(dashboard?.total_classrooms ?? normalizedClassrooms.length),
      tone: 'blue' as const,
    },
    {
      id: 'students',
      label: 'Total de Alunos',
      value: Number(dashboard?.total_students ?? normalizedStudents.length),
      tone: 'green' as const,
    },
    {
      id: 'pending',
      label: 'Solicitacoes pendentes',
      value: totalPendingRequests,
      tone: 'orange' as const,
    },
  ]

  async function createClassroom(name: string): Promise<void> {
    await api('/api/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })

    await mutateClassrooms()
  }

  async function renameClassroom(classroomId: string, name: string): Promise<void> {
    await api(`/api/classrooms/${classroomId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })

    await mutateClassrooms()
  }

  async function deleteClassroom(classroomId: string): Promise<void> {
    await api(`/api/classrooms/${classroomId}`, {
      method: 'DELETE',
    })

    await mutateClassrooms()
  }

  async function approveStudent(classroomId: string, studentId: string): Promise<void> {
    await api(`/api/classrooms/${classroomId}/students/${studentId}/approve`, {
      method: 'POST',
    })

    await mutateClassrooms()
  }

  async function rejectPendingStudent(classroomId: string, studentId: string): Promise<void> {
    await api(`/api/classrooms/${classroomId}/students/${studentId}/reject`, {
      method: 'DELETE',
    })

    await mutateClassrooms()
  }

  async function removeApprovedStudent(classroomId: string, studentId: string): Promise<void> {
    await api(`/api/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
    })

    await mutateClassrooms()
  }

  return {
    stats,
    classrooms: normalizedClassrooms,
    students: normalizedStudents,
    loading: classroomsLoading || dashboardLoading || studentsLoading,
    error: classroomsError || dashboardError || studentsError,
    createClassroom,
    renameClassroom,
    deleteClassroom,
    approveStudent,
    rejectPendingStudent,
    removeApprovedStudent,
  }
}
