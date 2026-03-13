/**
 * Tipos de usuario e dados comuns
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'scholar' | 'teacher' | 'admin';
  createdAt: string;
  updatedAt: string;

  interests?: string[] | null;

}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  code: string;
  createdAt: string;
  studentCount: number;
}

export interface StudentReport {
  id: string;
  studentId: string;
  classroomId: string;
  progress: number;
  lastAccess: string;
  status: 'active' | 'inactive' | 'completed';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}
