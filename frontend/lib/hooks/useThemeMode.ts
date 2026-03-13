'use client';

import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
const THEME_KEY = 'theme';
const THEME_EVENT = 'theme-change';

export function useThemeMode(defaultTheme: ThemeMode = 'light') {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);
  const [isReady, setIsReady] = useState(false);

  const applyTheme = (newTheme: ThemeMode) => {
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem(THEME_KEY, newTheme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: newTheme }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme: ThemeMode = savedTheme ?? (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setIsReady(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY || !event.newValue) return;
      const nextTheme = event.newValue as ThemeMode;
      setTheme(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    };

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeMode>;
      if (!customEvent.detail) return;
      setTheme(customEvent.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT, handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return { theme, toggleTheme, isReady };
}
