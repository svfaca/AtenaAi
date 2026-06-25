import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      {children}
    </div>
  );
}
