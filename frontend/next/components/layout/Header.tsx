'use client';

import { useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Session } from '@/lib/types/auth';

/**
 * Header genérico para rotas protegidas que não têm um header específico
 * Use HeaderTeacher e HeaderStudent para rotas específicas
 */
export default function Header({ session }: { session: Session }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
          toast.success('Até logo!');
          router.push('/');
        }
      } catch (error) {
        toast.error('Erro ao fazer logout');
      }
    });
  };

  const getInitials = useMemo(() => {
    const names = session.name.split(' ');
    return names
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [session.name]);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between h-16 shrink-0">
      <div className="flex items-center gap-3">
        <a href="/scholar" className="flex items-center text-xl font-bold text-slate-900 dark:text-slate-100">
          AtenaAI
        </a>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{session.name}</span>

        {/* Avatar */}
        <div className="relative group">
          <button
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity"
            title="Menu do usuário"
          >
            {getInitials}
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session.email}</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
