'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@/lib/types/auth';
import { cn } from '@/lib/utils/cn';

const SCHOLAR_LINKS = [
  { href: '/scholar', label: '📚 Dashboard', icon: 'dashboard' },
  { href: '/scholar/classes', label: '🏫 Minhas Turmas', icon: 'classes' },
  { href: '/scholar/chat', label: '💬 Chat IA', icon: 'chat' },
  { href: '/scholar/settings', label: '⚙️ Configurações', icon: 'settings' },
];

const TEACHER_LINKS = [
  { href: '/teacher', label: '📊 Dashboard', icon: 'dashboard' },
  { href: '/teacher/classes', label: '📝 Minhas Turmas', icon: 'classes' },
  { href: '/teacher/analytics', label: '📈 Relatórios', icon: 'analytics' },
];

export default function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();

  const links =
    session.role === 'teacher'
      ? TEACHER_LINKS
      : session.role === 'admin'
        ? []
        : SCHOLAR_LINKS;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">AtenaAI</h1>
        <p className="text-xs text-slate-500 mt-1">{session.role}</p>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'block px-4 py-2 rounded-lg transition text-sm',
              pathname === link.href
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500">v0.1.0</p>
      </div>
    </aside>
  );
}
