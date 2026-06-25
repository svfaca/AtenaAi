import { useEffect, useRef, useState } from "react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_CHECK_DEBOUNCE_MS = 500

export type EmailStatus = "idle" | "checking" | "available" | "reactivatable" | "taken"

type EmailAvailabilityResult = {
  available: boolean
  reactivatable: boolean
  message: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function useEmailValidation(email: string) {
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle")
  const [emailError, setEmailError] = useState("")
  const [emailNotice, setEmailNotice] = useState("")
  const emailCheckControllerRef = useRef<AbortController | null>(null)
  const emailCacheRef = useRef<Map<string, EmailAvailabilityResult>>(new Map())

  function applyAvailabilityResult(result: EmailAvailabilityResult) {
    if (result.reactivatable) {
      setEmailStatus("reactivatable")
      setEmailError("")
      setEmailNotice(
        result.message ||
          "Essa conta foi excluida anteriormente. Deseja reativa-la?"
      )
      return
    }

    setEmailStatus(result.available ? "available" : "taken")
    setEmailError(result.available ? "" : result.message || "Este email já está cadastrado")
    setEmailNotice(result.available ? result.message || "Email disponível!" : "")
  }

  async function requestEmailAvailability(
    emailToCheck: string,
    signal?: AbortSignal
  ): Promise<EmailAvailabilityResult> {
    const normalizedEmail = normalizeEmail(emailToCheck)
    const cachedResult = emailCacheRef.current.get(normalizedEmail)

    if (cachedResult) {
      return cachedResult
    }

    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    if (!res.ok) {
      throw new Error("Erro ao verificar email")
    }

    const data = await res.json()

    if (typeof data.available === "boolean") {
      const result = {
        available: data.available,
        reactivatable:
          typeof data.reactivatable === "boolean" ? data.reactivatable : false,
        message: typeof data.message === "string" ? data.message : "",
      }
      emailCacheRef.current.set(normalizedEmail, result)
      return result
    }

    throw new Error("Resposta inválida ao verificar email")
  }

  // Debounced email check (UX feedback)
  useEffect(() => {
    const normalizedEmail = normalizeEmail(email)

    if (emailCheckControllerRef.current) {
      emailCheckControllerRef.current.abort()
      emailCheckControllerRef.current = null
    }

    if (!normalizedEmail) {
      setEmailError("")
      setEmailNotice("")
      setEmailStatus("idle")
      return
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("")
      setEmailNotice("")
      setEmailStatus("idle")
      return
    }

    const cachedResult = emailCacheRef.current.get(normalizedEmail)
    if (cachedResult) {
      applyAvailabilityResult(cachedResult)
      return
    }

    const timeout = setTimeout(async () => {
      const controller = new AbortController()
      emailCheckControllerRef.current = controller
      setEmailStatus("checking")

      try {
        const result = await requestEmailAvailability(
          normalizedEmail,
          controller.signal
        )
        applyAvailabilityResult(result)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return
        }
        // Não converte erro de rede/500 em "email já cadastrado".
        setEmailStatus("idle")
        setEmailError("")
        setEmailNotice("")
      } finally {
        if (emailCheckControllerRef.current === controller) {
          emailCheckControllerRef.current = null
        }
      }
    }, EMAIL_CHECK_DEBOUNCE_MS)

    return () => {
      clearTimeout(timeout)
      if (emailCheckControllerRef.current) {
        emailCheckControllerRef.current.abort()
        emailCheckControllerRef.current = null
      }
    }
  }, [email])

  /**
   * Valida o email de forma síncrona (regex)
   */
  function validateEmailFormat(emailToValidate: string): boolean {
    const normalized = normalizeEmail(emailToValidate)
    return EMAIL_REGEX.test(normalized)
  }

  /**
   * Verifica disponibilidade do email (validação real no submit)
   * Retorna disponibilidade e sinaliza se a conta pode ser reativada
   * Lança exceção em caso de erro de rede
   */
  async function checkEmailAvailability(
    emailToCheck: string
  ): Promise<EmailAvailabilityResult> {
    if (emailCheckControllerRef.current) {
      emailCheckControllerRef.current.abort()
      emailCheckControllerRef.current = null
    }

    const normalized = normalizeEmail(emailToCheck)
    setEmailStatus("checking")

    try {
      const result = await requestEmailAvailability(normalized)
      applyAvailabilityResult(result)
      return result
    } catch (err) {
      setEmailStatus("idle")
      setEmailError("")
      setEmailNotice("")
      throw err
    }
  }

  /**
   * Reseta os estados de validação
   */
  function resetEmailValidation() {
    setEmailError("")
    setEmailNotice("")
    setEmailStatus("idle")
    if (emailCheckControllerRef.current) {
      emailCheckControllerRef.current.abort()
      emailCheckControllerRef.current = null
    }
  }

  return {
    emailStatus,
    emailError,
    emailNotice,
    setEmailError,
    validateEmailFormat,
    checkEmailAvailability,
    resetEmailValidation,
    normalizeEmail,
  }
}
