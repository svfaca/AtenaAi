import type { Metadata } from 'next';
import { TeacherPageClient } from '@/features/teacher';

export const metadata: Metadata = {
  title: 'Painel - Professor',
};

export default function TeacherDashboardPage() {
  return <TeacherPageClient />;
}
