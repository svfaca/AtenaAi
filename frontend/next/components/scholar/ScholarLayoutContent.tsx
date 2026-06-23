'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  initialClassrooms?: any[];
  initialConversations?: any[];
  error?: string | null;
}

export function ScholarLayoutContent({
  children,
}: Props) {
  return (
    <div className="flex flex-1 w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Main content */}
      {children}
    </div>
  );
}
