"use client"

import { Modal } from "@/shared/ui/Modal"
import { LoginForm } from "./LoginForm"
import type { AuthUser } from "@/features/auth/types/auth.types"

type Props = {
  open: boolean
  onClose: () => void
  onSwitchToSignup?: () => void
  onLoginSuccess?: (user: AuthUser) => void
}

export function LoginModal({ open, onClose, onSwitchToSignup, onLoginSuccess }: Props) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Fechar modal"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <LoginForm onSuccess={onClose} onLoginSuccess={onLoginSuccess} onSwitchToSignup={onSwitchToSignup} />
    </Modal>
  )
}
