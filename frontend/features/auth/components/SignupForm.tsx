"use client"

import { useState } from "react"
import { SignupFormData } from "../types/auth.types"
import { SignupStepEmail } from "./signup/SignupStepEmail"
import { SignupStepProfile } from "./signup/SignupStepProfile"
import { SignupStepRole } from "./signup/SignupStepRole"
import { SignupStepInterests } from "./signup/SignupStepInterests"

type Props = {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function SignupForm({ onSuccess, onSwitchToLogin }: Props) {
  const [step, setStep] = useState(1)

  const [form, setForm] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    birthdate: "",
    gender: "",
    role: "",
    interests: [],
  })

  function next() {
    setStep((s) => s + 1)
  }

  function back() {
    setStep((s) => s - 1)
  }

  return (
    <div className="w-full">
      {step === 1 && <SignupStepEmail form={form} setForm={setForm} next={next} />}

      {step === 2 && (
        <SignupStepProfile form={form} setForm={setForm} next={next} back={back} />
      )}

      {step === 3 && (
        <SignupStepRole form={form} setForm={setForm} next={next} back={back} />
      )}

      {step === 4 && (
        <SignupStepInterests
          form={form}
          setForm={setForm}
          back={back}
          onSuccess={onSuccess}
        />
      )}

      {/* Link para login */}
      {onSwitchToLogin && (
        <div className="text-center mt-4">
          <button
            onClick={onSwitchToLogin}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Já tem uma conta? Faça login
          </button>
        </div>
      )}
    </div>
  )
}
