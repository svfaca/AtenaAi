'use client';

import Header from './Header';
import HeaderTeacher from './HeaderTeacher';
import HeaderStudent from './HeaderStudent';
import type { Session } from '@/lib/types/auth';

interface RoleBasedHeaderProps {
  session: Session;
}

/**
 * Header dinâmico que renderiza o header correto baseado na role do usuário
 */
export default function RoleBasedHeader({ session }: RoleBasedHeaderProps) {
  // Backend pode usar 'student' ou 'scholar', 'professor' ou 'teacher'
  const role = session.role;
  const isTeacher = role === 'teacher' || role === 'professor';
  const isStudent = role === 'scholar' || role === 'student';

  if (isTeacher) {
    return <HeaderTeacher session={session} />;
  }

  if (isStudent) {
    return <HeaderStudent session={session} />;
  }

  // Default para outras roles (admin, etc)
  return <Header session={session} />;
}
