'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

export function PublicHeader() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openLogin, openSignup } = useAuth();

  // Inicializar tema ao montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = (savedTheme || (prefersDark ? 'dark' : 'light')) as 'light' | 'dark';
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900 z-10">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center text-xl font-bold hover:opacity-80 transition-opacity">
          <img 
            src={theme === 'dark' ? '/logo/logo-icon-dark.png' : '/logo/logo-icon-ligth.png'}
            alt="AtenaAI" 
            className="h-8 w-8 mr-2"
          />
          <span className="hidden sm:inline">AtenaAI</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle theme"
          title={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          )}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/about" className="text-sm font-medium hover:underline px-2 text-gray-700 dark:text-gray-300">
            Quem somos
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={openLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={openSignup}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-900 dark:text-gray-100"
            >
              Criar Conta
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 p-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-3">
            <Link 
              href="/about" 
              className="text-sm font-medium py-2 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Quem somos
            </Link>
            <button 
              onClick={() => {
                openLogin();
                setIsMobileMenuOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={() => {
                openSignup();
                setIsMobileMenuOpen(false);
              }}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium text-center transition-colors text-gray-900 dark:text-gray-100"
            >
              Criar Conta
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
