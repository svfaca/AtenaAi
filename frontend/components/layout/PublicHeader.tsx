'use client';

import { useState, useEffect } from 'react';
import { getLogoUrl } from '@/lib/logo';

export default function PublicHeader() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = (savedTheme || (prefersDark ? 'dark' : 'light')) as 'light' | 'dark';
    setTheme(initialTheme);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between h-16 shrink-0 z-10">
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          <img 
            src={getLogoUrl(theme)}
            alt="AtenaAI" 
            className="h-8 w-auto object-contain"
          />
          <span className="hidden sm:inline">AtenaAI</span>
        </a>
      </div>
    </header>
  );
}
