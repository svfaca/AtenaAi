'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type AppHeaderProps = {
  logo: string;
  userBadge?: ReactNode;
  actions?: ReactNode;
  mobileMenuButton?: ReactNode;
  onLogoClick?: () => void;
};

/**
 * AppHeader - Pure presentation component
 * 
 * Responsibilities:
 * - Render header structure
 * - Accept slots for customization
 * - NO business logic
 * - NO data fetching
 */
export default function AppHeader({
  logo,
  userBadge,
  actions,
  mobileMenuButton,
  onLogoClick,
}: AppHeaderProps) {
  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center">
        {/* Mobile menu button slot */}
        {mobileMenuButton}

        {/* Logo */}
        <Link href="/" onClick={onLogoClick} className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
          <Image
            src={logo}
            alt="AtenaAI"
            width={32}
            height={32}
            className="mr-2"
            style={{ width: 'auto', height: 'auto' }}
          />
          AtenaAI
        </Link>

        {/* User badge slot (e.g., "Estudante", "Professor") */}
        {userBadge}
      </div>

      {/* Actions slot (theme toggle, links, etc.) */}
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
}
