"use client"

import { useState } from "react"
import { SignupFormData } from "../../types/auth.types"
import { useEmailValidation } from "../../hooks/useEmailValidation"
import { useNotification } from "@/lib/hooks/useNotification"

type Props = {
  form: SignupFormData
  setForm: (form: SignupFormData) => void
  next: () => void
}

export function SignupStepEmail({ form, setForm, next }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { error: errorToast } = useNotification()

  const {
    emailStatus,
    emailError,
    emailNotice,
    validateEmailFormat,
    checkEmailAvailability,
    normalizeEmail,
  } = useEmailValidation(form.email)

  async function handleContinue() {
    setError("")

    // Validações de campos vazios
    if (!form.email || !form.password || !form.confirmPassword) {
      const msg = "Preencha todos os campos"
      setError(msg)
      errorToast(msg)
      return
    }

    // Validação de formato de email
    if (!validateEmailFormat(form.email)) {
      const msg = "Email inválido"
      setError(msg)
      errorToast(msg)
      return
    }

    // Validação de senha
    if (form.password.length < 8) {
      const msg = "A senha deve ter no mínimo 8 caracteres"
      setError(msg)
      errorToast(msg)
      return
    }

    if (form.password !== form.confirmPassword) {
      const msg = "As senhas não coincidem"
      setError(msg)
      errorToast(msg)
      return
    }

    // Verificação final de disponibilidade do email
    try {
      setLoading(true)
      const availability = await checkEmailAvailability(form.email)

      if (!availability.available) {
        const msg = "Email já cadastrado. Por favor, use outro email."
        setError(msg)
        errorToast(msg)
        return
      }

      // Email disponível e validações OK - avança para próximo passo
      next()
    } catch (err) {
      const msg = "Erro ao verificar email. Tente novamente."
      setError(msg)
      errorToast(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Criar Conta
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Passo 1 de 4 - Credenciais de acesso
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="seu@email.com"
            value={form.email}
            onChange={(e) => {
              const emailValue = normalizeEmail(e.target.value)
              setForm({ ...form, email: emailValue })
              setError("")
            }}
            disabled={loading}
            autoComplete="email"
          />
          {emailStatus === "checking" && !emailError && (
            <p className="text-blue-500 text-xs mt-1">Verificando email...</p>
          )}
          {emailStatus === "available" && !emailError && (
            <p className="text-green-600 text-xs mt-1">Email disponível!</p>
          )}
          {emailStatus === "reactivatable" && !emailError && (
            <p className="text-amber-600 text-xs mt-1">
              {emailNotice || "Essa conta foi excluida anteriormente. Deseja reativa-la?"}
            </p>
          )}
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mínimo de 6 caracteres
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Confirmar senha
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 px-4 rounded-md font-medium flex justify-center items-center gap-2 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verificando...
            </>
          ) : (
            emailStatus === "reactivatable" ? "Reativar conta" : "Continuar"
          )}
        </button>
      </div>
    </div>
  )
}
