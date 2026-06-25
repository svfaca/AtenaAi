'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMobileMenu } from '@/components/context/MobileMenuContext';
import type { Session } from '@/lib/types/auth';

export default function HeaderStudent({ session }: { session: Session }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { toggleMenu } = useMobileMenu();

  // Inicializar tema ao montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = (savedTheme || (prefersDark ? 'dark' : 'light')) as 'light' | 'dark';
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

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

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between h-16 shrink-0 z-10">
      {/* Esquerda: Botão Mobile + Logo */}
      <div className="flex items-center gap-3">
        {/* Botão menu mobile */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          title="Abrir/fechar menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo com imagem */}
        <a href="/scholar" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity">
          <img 
            src={theme === 'dark' ? '/logo/logo-icon-dark.png' : '/logo/logo-icon-ligth.png'}
            alt="AtenaAI" 
            className="h-8 w-8"
          />
          <span className="hidden sm:inline">AtenaAI</span>
        </a>

        {/* Badge Estudante */}
        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
          Estudante
        </span>
      </div>

      {/* Direita: Toggle Tema + Link Quem Somos + Logout */}
      <div className="flex items-center gap-3">
        {/* Botão toggle tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          )}
        </button>
        {/* Link Quem Somos */}
        <a
          href="/"
          className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Quem Somos
        </a>

        {/* Botão Sair */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          title="Fazer logout"
        >
          {isPending ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </header>
  );
}
