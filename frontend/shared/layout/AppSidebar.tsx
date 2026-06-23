'use client';

import { ReactNode, useEffect, useLayoutEffect, useMemo, useState } from 'react';

// Runs synchronously before the browser paints on the client.
// Falls back to useEffect to avoid SSR warnings during server render.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type SidebarRenderProp = (args: { isCollapsed: boolean }) => ReactNode;

type AppSidebarProps = {
  userName: string;
  userInitial: string;
  userAvatar?: string | null;
  userRole?: string;
  content: ReactNode | SidebarRenderProp;
  footer: ReactNode | SidebarRenderProp;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

/**
 * AppSidebar - Structural sidebar component
 * 
 * Responsibilities:
 * - Sidebar structure (header, content, footer)
 * - Collapse/expand UI state
 * - Mobile overlay
 * - NO data fetching
 * - NO business logic
 */
export default function AppSidebar({
  userName,
  userInitial,
  userAvatar,
  userRole = 'Usuário',
  content,
  footer,
  isMobileOpen = false,
  onCloseMobile,
}: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    // Set correct value immediately — before first paint on the client
    setIsDesktop(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Regra central: colapso existe apenas no desktop.
  const isDesktopCollapsed = isDesktop && isCollapsed;

  const desktopCollapsedClass = isDesktopCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64';
  const mobileVisibilityClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const avatarUrl = userAvatar
    ? (userAvatar.startsWith('http') ? userAvatar : `${API_URL}${userAvatar}`)
    : null;

  const avatarToggleLabel = useMemo(() => {
    if (!isDesktop) {
      return 'Perfil do usuário';
    }

    return isDesktopCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral';
  }, [isDesktop, isDesktopCollapsed]);

  const handleToggleCollapsed = () => {
    if (!isDesktop) {
      return;
    }

    setIsCollapsed((prev) => !prev);
  };

  return (
    <>
      {/* Mobile overlay */}
      <button
        aria-label="Fechar menu lateral"
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${isMobileOpen ? 'block' : 'hidden'}`}
        onClick={onCloseMobile}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-72 border-r border-gray-200 bg-gray-50 transition-all duration-300
          dark:border-gray-700 dark:bg-gray-800
          lg:static lg:z-30 lg:translate-x-0
          ${desktopCollapsedClass}
          ${mobileVisibilityClass}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header with user info */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
            {/* Avatar + name (acts as toggle) */}
            <button
              onClick={handleToggleCollapsed}
              className="flex min-w-0 items-center gap-3 hover:opacity-80"
              aria-label={avatarToggleLabel}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitial
                )}
              </div>

              {!isDesktopCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-gray-500">{userRole}</p>
                </div>
              )}
            </button>

            {/* Collapse toggle button */}
            {isDesktop && !isDesktopCollapsed && (
              <button
                onClick={handleToggleCollapsed}
                className="rounded p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Recolher menu lateral"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto scrollbar-custom p-3">
            {/* Pass isCollapsed to children via context if needed,
                or children can use CSS to handle collapsed state */}
            {typeof content === 'function' ? content({ isCollapsed: isDesktopCollapsed }) : content}
          </div>

          {/* Footer */}
          {typeof footer === 'function' ? footer({ isCollapsed: isDesktopCollapsed }) : footer}
        </div>
      </aside>
    </>
  );
}
