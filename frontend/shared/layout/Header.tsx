'use client';

import { useTransition, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Session } from '@/lib/types/auth';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import { useAboutModal } from '@/features/about';
import { useNotification } from '@/lib/hooks/useNotification';
import { useAuth } from '@/features/auth';

type PublicHeaderProps = {
  variant: 'public';
};

type ProtectedHeaderProps = {
  variant?: 'protected';
  session: Session;
};

type HeaderProps = PublicHeaderProps | ProtectedHeaderProps;

export default function Header(props: HeaderProps) {
  if (props.variant === 'public') {
    return <PublicVariantHeader />;
  }

  return <ProtectedVariantHeader session={props.session} />;
}

function ProtectedVariantHeader({ session }: { session: Session }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { success, error: errorToast } = useNotification();
  const { logout } = useAuth();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        console.log('[Header] 1. Iniciando logout...');
        await logout();
        console.log('[Header] 2. Logout backend completo');
        
        console.log('[Header] 3. Disparando toast success...');
        success('Até logo!');
        console.log('[Header] 4. Toast disparado');
        
        // Aguarda mais tempo para o toast ser renderizado antes de redirecionar
        console.log('[Header] 5. Aguardando 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('[Header] 6. Redirecionando para /...');
        router.push('/');
      } catch (error) {
        console.error('[Header] Erro no logout:', error);
        errorToast('Erro ao fazer logout');
      }
    });
  };

  const getInitials = useMemo(() => {
    if (!session?.name) return '';
    
    const names = session.name.split(' ');
    return names
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [session?.name]);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between h-16 shrink-0">
      <div className="flex items-center gap-3">
        <a href="/scholar" className="flex items-center text-xl font-bold text-slate-900 dark:text-slate-100">
          AtenaAI
        </a>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{session?.name}</span>

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
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session?.email}</p>
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

function PublicVariantHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeMode();
  const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal();
  const isDark = theme === 'dark';

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAboutOpen) {
      event.preventDefault();
      closeAbout();
    }
  };

  return (
    <header className="relative z-30 h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Link href="/" onClick={handleBrandClick} className="flex items-center text-xl font-bold">
          <Image
            src={isDark ? '/logo/logo-icon-dark.png' : '/logo/logo-icon-ligth.png'}
            alt="AtenaAI"
            width={32}
            height={32}
            className="mr-2"
            style={{ width: 'auto', height: 'auto' }}
          />
          <span className="text-gray-900 dark:text-gray-100">AtenaAI</span>
        </Link>
        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          Beta
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          aria-label="Alternar tema"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          )}
        </button>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={isAboutOpen ? closeAbout : openAbout}
            type="button"
            className="text-sm font-medium hover:underline px-2"
          >
            {isAboutOpen ? 'Fechar' : 'Sobre'}
          </button>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Criar Conta
          </Link>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 p-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (isAboutOpen) {
                  closeAbout();
                } else {
                  openAbout();
                }
                setIsMobileMenuOpen(false);
              }}
              type="button"
              className="text-left text-sm font-medium py-2 border-b border-gray-100 dark:border-gray-800"
            >
              {isAboutOpen ? 'Fechar' : 'Sobre'}
            </button>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium text-center"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
