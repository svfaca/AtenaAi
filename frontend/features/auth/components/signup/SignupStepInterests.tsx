"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SignupFormData } from "../../types/auth.types"
import { useAuth } from "@/features/auth"
import { useNotification } from "@/lib/hooks/useNotification"
import * as authService from "../../services/auth.service"
import { INTERESTS, getInterestLabel } from "@/lib/constants/interests"

type Props = {
  form: SignupFormData
  setForm: (form: SignupFormData) => void
  back: () => void
  onSuccess?: () => void
}

export function SignupStepInterests({
  form,
  setForm,
  back,
  onSuccess,
}: Props) {
  const router = useRouter()
  const { login } = useAuth()
  const { success, error: errorToast } = useNotification()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggleInterest(interest: string) {
    const current = form.interests || []
    if (current.includes(interest)) {
      setForm({ ...form, interests: current.filter((i) => i !== interest) })
    } else {
      setForm({ ...form, interests: [...current, interest] })
    }
  }

  async function handleSubmit() {
    setError("")
    setLoading(true)

    try {
      // Preparar dados para envio
      const signupData = {
        name: form.name,
        email: form.email,
        password: form.password,
        birthdate: form.birthdate,
        gender: form.gender,
        role: form.role as "student" | "teacher",
        interests: form.interests,
      }

      const signupResponse = await authService.signup(signupData)

      // Keep client auth state in sync after signup.
      await login(form.email, form.password)

      const successMsg = signupResponse.reactivated
        ? "Conta reativada com sucesso!"
        : "Conta criada com sucesso!"
      success(successMsg)
      onSuccess?.()
      router.push("/scholar")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente."
      setError(message)
      errorToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Áreas de Interesse
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Passo 4 de 4 - Selecione suas áreas de interesse (opcional)
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {INTERESTS.map((interest) => {
            const isSelected = form.interests.includes(interest.id)
            return (
              <label
                key={interest.id}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleInterest(interest.id)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {getInterestLabel(interest.id)}
                </span>
              </label>
            )
          })}
        </div>

        {form.interests.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {form.interests.length} {form.interests.length === 1 ? "interesse selecionado" : "interesses selecionados"}
          </p>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={back}
            disabled={loading}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-gray-100 py-2.5 px-4 rounded-md font-medium transition-colors"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 px-4 rounded-md font-medium flex justify-center items-center gap-2 transition-colors"
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
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
