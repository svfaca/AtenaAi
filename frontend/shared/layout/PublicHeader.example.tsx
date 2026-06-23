"use client"

import { useState } from "react"
import { LoginModal, SignupModal } from "@/features/auth"
import { useAboutModal } from "@/features/about"

/**
 * Exemplo de uso dos modais de autenticação
 * 
 * Este componente demonstra como:
 * - Controlar o estado de abertura/fechamento dos modais
 * - Alternar entre modais de login e signup
 * - Usar os modais em qualquer parte da aplicação
 */
export function PublicHeader() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const { openAbout } = useAboutModal()

  // Função para trocar de login para signup
  const switchToSignup = () => {
    setLoginOpen(false)
    setSignupOpen(true)
  }

  // Função para trocar de signup para login
  const switchToLogin = () => {
    setSignupOpen(false)
    setLoginOpen(true)
  }

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-700 py-4 px-4 flex justify-between items-center bg-white dark:bg-gray-800">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="flex items-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <img 
              src="/assets/logo/logo-icon-ligth.png" 
              alt="Logo AtenaAI" 
              className="h-9 w-9 mr-2"
            />
            AtenaAI
          </a>
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            Beta
          </span>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          <button 
            onClick={openAbout}
            className="text-sm font-medium hover:underline px-2"
          >
            Sobre
          </button>

          <button
            onClick={() => setLoginOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Entrar
          </button>

          <button
            onClick={() => setSignupOpen(true)}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Criar Conta
          </button>
        </div>
      </header>

      {/* Modais */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={switchToSignup}
      />

      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}
