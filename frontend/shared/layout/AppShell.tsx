'use client';

import { ReactNode } from 'react';

type AppShellProps = {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  settingsPanel?: ReactNode;
  about?: ReactNode;
};

/**
 * AppShell - Pure structural layout component
 * 
 * Slot-based architecture:
 * - header: Top bar (logo, navigation)
 * - sidebar: Left sidebar (navigation, features)
 * - children: Main content area
 * - settingsPanel: Optional overlay panel
 * - about: Optional full-screen About panel (in layout flow)
 * 
 * Responsibilities:
 * - Layout structure only (flex, grid, positioning)
 * - NO data fetching
 * - NO business logic
 * - NO state management
 * 
 * Usage:
 * ```tsx
 * <AppShell
 *   header={<AppHeader />}
 *   sidebar={<StudentSidebar />}
 *   about={isAboutOpen ? <AboutModal /> : null}
 * >
 *   <ChatWindow />
 * </AppShell>
 * ```
 */
export default function AppShell({
  header,
  sidebar,
  children,
  settingsPanel,
  about,
}: AppShellProps) {
  return (
    <div className="flex h-screen min-h-0 overflow-hidden">
      {/* Sidebar slot */}
      {sidebar}

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header slot */}
        {header}

        {/* About replaces main content when open so it uses all available space */}
        {about ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{about}</div>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        )}
      </div>

      {/* Settings panel slot (optional) */}
      {settingsPanel}
    </div>
  );
}
