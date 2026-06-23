'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import { useUIStore } from '@/stores';
import { useAuth } from '@/features/auth';
import { useAboutModal, AboutModal } from '@/features/about';
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView';
import ClassroomPageModal from '@/features/classrooms/components/modals/ClassroomPageModal';
import AppShell from '@/shared/layout/AppShell';
import StudentSidebar from './StudentSidebar';
import SettingsSidebar from './SettingsSidebar';

type StudentLayoutProps = {
  children: React.ReactNode;
};

/**
 * StudentLayout - Composition layer only
 * 
 * Responsibilities:
 * - Compose AppShell with feature components
 * - Uses AuthContext for reactive user state
 * - NO data fetching (handled by feature components)
 * - NO complex state (uses useAppUI for UI state)
 */
export default function StudentLayout({ children }: StudentLayoutProps) {
  const { theme, toggleTheme } = useThemeMode();
  const router = useRouter();
  const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal();
  const {
    isOpen: isClassroomOpen,
    classroom,
    closeClassroom,
  } = useClassroomView();
  const { user, logout } = useAuth(); // 🎯 Use AuthContext instead of static prop
  
  // UI state from UI store
  const {
    isMobileSidebarOpen,
    isSettingsOpen,
    openMobileSidebar,
    closeMobileSidebar,
    openSettings,
    closeSettings,
  } = useUIStore();

  const userName = user?.full_name || user?.nickname || 'Estudante';
  const userInitial = useMemo(() => {
    return userName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  }, [userName]);

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAboutOpen) {
      event.preventDefault();
      closeAbout();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('[StudentLayout] Logout error:', error);
      router.push('/');
    }
  };

  // Header component
  const header = (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center">
        <button
          aria-label="Abrir menu lateral"
          className="mr-3 rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          onClick={openMobileSidebar}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
        </button>

        <Link href="/" onClick={handleBrandClick} className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
          <Image
            src={theme === 'dark' ? '/logo/logo-icon-dark.png' : '/logo/logo-icon-ligth.png'}
            alt="AtenaAI"
            width={32}
            height={32}
            className="mr-2"
            style={{ width: 'auto', height: 'auto' }}
          />
          AtenaAI
        </Link>

        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Estudante
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Alternar tema"
          className="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        <button
          onClick={isAboutOpen ? closeAbout : openAbout}
          className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 md:block"
          type="button"
        >
          {isAboutOpen ? 'Fechar' : 'Sobre'}
        </button>
      </div>
    </header>
  );

  // Sidebar component
  const sidebar = (
    <StudentSidebar
      userName={userName}
      userInitial={userInitial}
      avatarUrl={user?.profile_image}
      onCloseMobile={closeMobileSidebar}
      onOpenSettings={openSettings}
      onLogout={handleLogout}
    />
  );

  // Settings panel
  const settingsPanel = (
    <SettingsSidebar
      open={isSettingsOpen}
      onClose={closeSettings}
    />
  );

  return (
    <AppShell
      header={header}
      sidebar={sidebar}
      settingsPanel={settingsPanel}
      about={
        isClassroomOpen ? (
          <ClassroomPageModal classroom={classroom} onClose={closeClassroom} />
        ) : (
          isAboutOpen && <AboutModal />
        )
      }
    >
      {children}
    </AppShell>
  );
}
