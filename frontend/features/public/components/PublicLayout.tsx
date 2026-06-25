'use client';

import { ReactNode } from 'react';
import { useAboutModal, AboutModal } from '@/features/about';
import AppShell from '@/shared/layout/AppShell';
import PublicHeader from '@/shared/layout/PublicHeader';

type PublicLayoutProps = {
  children: ReactNode;
};

/**
 * PublicLayout - Composition for public (non-logged-in) experience
 * 
 * Responsibilities:
 * - Compose AppShell with public-specific components
 * - Render About in layout flow so it responds to viewport changes
 * 
 * Does NOT:
 * - Fetch data
 * - Handle business logic
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  const { isOpen: isAboutOpen } = useAboutModal();

  const header = <PublicHeader />;

  return (
    <AppShell
      header={header}
      sidebar={<div />}
      about={isAboutOpen && <AboutModal />}
    >
      {children}
    </AppShell>
  );
}
