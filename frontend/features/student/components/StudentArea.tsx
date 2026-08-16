'use client';

import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import { getLogoUrl } from '@/lib/logo';
import { useAboutModal, AboutModal } from '@/features/about';
import { useNavigationState } from '@/features/navigation/hooks/useNavigationState';
import { useUIStore } from '@/stores';
import { useAuth } from '@/features/auth';
import AppShell from '@/shared/layout/AppShell';
import AppHeader from '@/shared/layout/AppHeader';
import AppSidebar from '@/shared/layout/AppSidebar';
import RoomsSidebarSection from '@/features/classrooms/components/RoomsSidebarSection';
import ConversationsSidebarSection from '@/features/conversations/components/ConversationsSidebarSection';
import SidebarFooter from '@/shared/layout/SidebarFooter';
import SettingsSidebar from '@/features/student/components/SettingsSidebar';
import MainContent from '@/features/student/components/MainContent';

type StudentAreaProps = {
  userName: string;
  userAvatar?: string | null;
  children?: ReactNode;
};

/**
 * StudentArea - Composition component for student experience
 *
 * Responsibilities:
 * - Compose AppShell with student-specific components
 * - Manage UI state (mobile sidebar, settings panel)
 * - Render content via MainContent (não via children)
 *
 * Does NOT:
 * - Fetch data (delegated to feature components)
 * - Handle business logic (delegated to feature components)
 */
export default function StudentArea({ userName, userAvatar, children }: StudentAreaProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar } = useUIStore();
  const { theme, toggleTheme } = useThemeMode();
  const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal();
  const navigationState = useNavigationState();
  const { logout } = useAuth();
  const router = useRouter();

  const handleBrandClick = () => {
    if (isAboutOpen) {
      closeAbout();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('[StudentArea] Logout error:', error);
      router.push('/');
    }
  };

  const handleAboutClick = isAboutOpen ? closeAbout : openAbout;

  const userInitial = useMemo(() => {
    return userName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  }, [userName]);

  // Fechar a sidebar mobile sempre que o usuário navegar (mudar de visualização,
  // conversa ou sala) enquanto ela estiver aberta. A "chave" combina viewType +
  // conversationId + classroomId para detectar inclusive a troca de conversa A→B
  // (onde viewType permanece 'conversation').
  const getNavigationKey = () =>
    `${navigationState.viewType ?? 'none'}|${navigationState.conversationId ?? 'none'}|${navigationState.classroomId ?? 'none'}`;

  const lastNavigationKeyRef = useRef(getNavigationKey());

  useEffect(() => {
    const previousKey = lastNavigationKeyRef.current;
    const currentKey = getNavigationKey();
    lastNavigationKeyRef.current = currentKey;

    if (isMobileSidebarOpen && currentKey !== previousKey) {
      closeMobileSidebar();
    }
  }, [
    navigationState.viewType,
    navigationState.conversationId,
    navigationState.classroomId,
    isMobileSidebarOpen,
    closeMobileSidebar,
  ]);

  const logoPath = getLogoUrl(theme);

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
              className="mr-3 rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
              onClick={openMobileSidebar}
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
          onCloseMobile={closeMobileSidebar}
          content={({ isCollapsed }) => (
            <>
              <RoomsSidebarSection isCollapsed={isCollapsed} />
              <ConversationsSidebarSection isCollapsed={isCollapsed} />
            </>
          )}
          footer={({ isCollapsed }) => (
            <SidebarFooter
              isCollapsed={isCollapsed}
              onOpenSettings={() => {
                closeMobileSidebar();
                setSettingsOpen(true);
              }}
              onLogout={handleLogout}
              aboutLabel={isAboutOpen ? 'Fechar' : 'Sobre'}
              onAboutClick={() => {
                closeMobileSidebar();
                handleAboutClick();
              }}
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
      about={isAboutOpen && <AboutModal />}
    >
      {children ?? <MainContent />}
    </AppShell>
  );
}
