'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import { useAboutModal, AboutModal } from '@/features/about';
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView';
import ClassroomPageModal from '@/features/classrooms/components/modals/ClassroomPageModal';
import AppShell from '@/shared/layout/AppShell';
import AppHeader from '@/shared/layout/AppHeader';
import AppSidebar from '@/shared/layout/AppSidebar';
import StudentSidebarContent from '@/features/student/components/StudentSidebarContent';
import SidebarFooter from '@/features/student/components/SidebarFooter';
import SettingsSidebar from '@/features/student/components/SettingsSidebar';

type StudentAreaProps = {
  userName: string;
  userAvatar?: string | null;
  children: React.ReactNode;
};

/**
 * StudentArea - Composition component for student experience
 *
 * Responsibilities:
 * - Compose AppShell with student-specific components
 * - Manage UI state (mobile sidebar, settings panel)
 * - Pass children to main area
 *
 * Does NOT:
 * - Fetch data (delegated to feature components)
 * - Handle business logic (delegated to feature components)
 */
export default function StudentArea({ userName, userAvatar, children }: StudentAreaProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useThemeMode();
  const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal();
  const { isOpen: isClassroomOpen, classroom, closeClassroom } = useClassroomView();

  const handleBrandClick = () => {
    if (isAboutOpen) {
      closeAbout();
    }
  };

  const userInitial = useMemo(() => {
    return userName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  }, [userName]);

  // Fechar sidebar mobile quando sala abrir
  useEffect(() => {
    if (isClassroomOpen && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isClassroomOpen, isMobileSidebarOpen]);

  const logoPath = theme === 'dark' ? '/logo/logo-icon-dark.png' : '/logo/logo-icon-ligth.png';

  return (
    <AppShell
      header={
        <AppHeader
          logo={logoPath}
          onLogoClick={handleBrandClick}
          userBadge={
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Estudante
            </span>
          }
          actions={
            <>
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
            </>
          }
          mobileMenuButton={
            <button
              aria-label="Abrir menu lateral"
              className="mr-3 rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          }
        />
      }
      sidebar={
        <AppSidebar
          userName={userName}
          userInitial={userInitial}
          userAvatar={userAvatar}
          userRole="Estudante"
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          content={({ isCollapsed }) => (
            <StudentSidebarContent isCollapsed={isCollapsed} />
          )}
          footer={({ isCollapsed }) => (
            <SidebarFooter
              isCollapsed={isCollapsed}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
        />
      }
      settingsPanel={
        <SettingsSidebar
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      }
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
