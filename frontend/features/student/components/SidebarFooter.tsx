'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useAboutModal } from '@/features/about';
import SettingsSidebar from '@/features/student/components/SettingsSidebar';

type SidebarFooterProps = {
  isCollapsed: boolean;
  onOpenSettings?: () => void;
};

export default function SidebarFooter({ isCollapsed, onOpenSettings }: SidebarFooterProps) {
  const [isLocalSettingsOpen, setIsLocalSettingsOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal();
  const handleAboutClick = () => (isAboutOpen ? closeAbout() : openAbout());

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('[SidebarFooter] Logout error:', error);
      router.push('/');
    }
  };

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }

    setIsLocalSettingsOpen(true);
  };

  return (
    <>
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <nav className="space-y-1">
          {isCollapsed ? (
            <>
              <button
                onClick={handleAboutClick}
                className="flex justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label={isAboutOpen ? 'Fechar' : 'Sobre'}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
              <button
                onClick={handleOpenSettings}
                className="flex w-full justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label="Configurações"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.37 2.37 1.724 1.724 0 001.065 2.572 1.724 1.724 0 010 3.35 1.724 1.724 0 00-1.066 2.573 1.724 1.724 0 01-2.37 2.37 1.724 1.724 0 00-2.572 1.065 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.37-2.37 1.724 1.724 0 00-1.065-2.572 1.724 1.724 0 010-3.35 1.724 1.724 0 001.066-2.573 1.724 1.724 0 012.37-2.37 1.724 1.724 0 002.572-1.065z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                  <path
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label="Sair"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAboutClick}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <span>{isAboutOpen ? 'Fechar' : 'Sobre'}</span>
              </button>
              <button
                onClick={handleOpenSettings}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.37 2.37 1.724 1.724 0 001.065 2.572 1.724 1.724 0 010 3.35 1.724 1.724 0 00-1.066 2.573 1.724 1.724 0 01-2.37 2.37 1.724 1.724 0 00-2.572 1.065 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.37-2.37 1.724 1.724 0 00-1.065-2.572 1.724 1.724 0 010-3.35 1.724 1.724 0 001.066-2.573 1.724 1.724 0 012.37-2.37 1.724 1.724 0 002.572-1.065z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                  <path
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <span>Configurações</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <span>Sair</span>
              </button>
            </>
          )}
        </nav>
      </div>

      <SettingsSidebar
        open={isLocalSettingsOpen}
        onClose={() => setIsLocalSettingsOpen(false)}
      />

    </>
  );
}
