'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth, LoginModal, SignupModal } from '@/features/auth'
import { useThemeMode } from '@/lib/hooks/useThemeMode'
import { getLogoUrl } from '@/lib/logo'

type AboutHeaderProps = {
  onClose?: () => void
}

export default function AboutHeader({ onClose }: AboutHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const { theme, toggleTheme } = useThemeMode()
  const { user, logout } = useAuth()
  const router = useRouter()
  const isDark = theme === 'dark'

  return (
    <>
      <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900 z-10">
        {/* Esquerda */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center text-xl font-bold">
            <Image
              src={getLogoUrl(theme)}
              alt="AtenaAI"
              width={32}
              height={32}
              className="mr-2 h-8 w-auto object-contain"
            />
            <span className="text-gray-900 dark:text-gray-100">AtenaAI</span>
          </Link>
          <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            Beta
          </span>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-2">
          {/* Toggle de tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label="Alternar tema"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Ações desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Voltar — substitui o botão "Sobre" do PublicHeader */}
            <button onClick={onClose} className="text-sm font-medium hover:underline px-2">
              Voltar
            </button>

            {user ? (
              // Logado: Dashboard + nome (sem foto de perfil) + Sair
              <>
                <Link
                  href={user.role === 'teacher' ? '/teacher' : '/scholar'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <span className="text-sm font-medium px-1">{user.name}</span>
                <button
                  onClick={() => logout()}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline px-2"
                >
                  Sair
                </button>
              </>
            ) : (
              // Deslogado: Entrar + Criar Conta
              <>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setSignupOpen(true)}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>

          {/* Hambúrguer mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 p-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { onClose?.(); setIsMobileMenuOpen(false) }}
              className="text-left text-sm font-medium py-2 border-b border-gray-100 dark:border-gray-800"
            >
              Voltar
            </button>

            {user ? (
              <>
                <span className="text-sm font-medium">{user.name}</span>
                <Link
                  href={user.role === 'teacher' ? '/teacher' : '/scholar'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setLoginOpen(true); setIsMobileMenuOpen(false) }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setSignupOpen(true); setIsMobileMenuOpen(false) }}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium text-center"
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modais de autenticação */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => { setLoginOpen(false); setSignupOpen(true) }}
        onLoginSuccess={(loggedUser) => {
          setLoginOpen(false)
          onClose?.()
          const path = loggedUser.role === 'teacher' ? '/teacher' : '/scholar'
          router.push(path)
        }}
      />
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={() => { setSignupOpen(false); setLoginOpen(true) }}
      />
    </>
  )
}