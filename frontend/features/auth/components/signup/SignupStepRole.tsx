"use client"

import { useState } from "react"
import { SignupFormData } from "../../types/auth.types"

type Props = {
  form: SignupFormData
  setForm: (form: SignupFormData) => void
  next: () => void
  back: () => void
}

export function SignupStepRole({ form, setForm, next, back }: Props) {
  const [error, setError] = useState("")

  function handleContinue() {
    setError("")

    if (!form.role) {
      setError("Selecione o tipo de conta")
      return
    }

    next()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tipo de Conta
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Passo 3 de 4 - Como você vai usar a AtenaAI?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <label
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              form.role === "student"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <input
              type="radio"
              name="role"
              value="student"
              checked={form.role === "student"}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "student" })
              }
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Estudante
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Aprenda com a IA, tire dúvidas e receba suporte personalizado nos seus estudos
              </p>
            </div>
          </label>

          <label
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              form.role === "teacher"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <input
              type="radio"
              name="role"
              value="teacher"
              checked={form.role === "teacher"}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "teacher" })
              }
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Professor
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gerencie turmas, acompanhe o progresso dos alunos e utilize IA para otimizar o ensino
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={back}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 py-2.5 px-4 rounded-md font-medium transition-colors"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
