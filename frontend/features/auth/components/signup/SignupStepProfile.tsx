"use client"

import { useState } from "react"
import { SignupFormData } from "../../types/auth.types"

type Props = {
  form: SignupFormData
  setForm: (form: SignupFormData) => void
  next: () => void
  back: () => void
}

export function SignupStepProfile({ form, setForm, next, back }: Props) {
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setForm({ ...form, profileImage: file })
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleContinue() {
    setError("")

    if (!form.name.trim()) {
      setError("O nome completo é obrigatório")
      return
    }

    if (!form.birthdate) {
      setError("A data de nascimento é obrigatória")
      return
    }

    if (!form.gender) {
      setError("Selecione sua identidade de gênero")
      return
    }

    if (form.gender === "other" && !form.genderCustom?.trim()) {
      setError("Por favor, descreva sua identidade de gênero")
      return
    }

    next()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Informações Pessoais
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Passo 2 de 4 - Conte-nos sobre você
        </p>
      </div>

      <div className="space-y-4">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center">
          <label
            htmlFor="profile-image"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">
              {previewUrl ? "Alterar foto" : "Adicionar foto (opcional)"}
            </span>
          </label>
          <input
            id="profile-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Nome completo */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Seu nome completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
          />
        </div>

        {/* Data de nascimento */}
        <div>
          <label
            htmlFor="birthdate"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Data de nascimento
          </label>
          <input
            id="birthdate"
            type="date"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={form.birthdate}
            onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
            autoComplete="bday"
          />
        </div>

        {/* Identidade de gênero */}
        <div className="w-full max-w-full min-w-0">
          <label
            htmlFor="gender"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Identidade de gênero
          </label>
          <select
            id="gender"
            className="block w-full max-w-full min-w-0 px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value, genderCustom: "" })}
          >
            <option value="">Selecione uma opção</option>
            <option value="masculine">Masculino</option>
            <option value="feminine">Feminino</option>
            <option value="non_binary">Não-binário</option>
            <option value="prefer_not">Prefiro não informar</option>
            <option value="other">Outro</option>
          </select>
        </div>

        {/* Campo customizado se "Outro" for selecionado */}
        {form.gender === "other" && (
          <div>
            <label
              htmlFor="gender-custom"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              Como você se identifica?
            </label>
            <input
              id="gender-custom"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="Descreva sua identidade de gênero"
              value={form.genderCustom || ""}
              onChange={(e) => setForm({ ...form, genderCustom: e.target.value })}
            />
          </div>
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
