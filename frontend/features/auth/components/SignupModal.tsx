"use client"

import { Modal } from "@/shared/ui/Modal"
import { SignupForm } from "./SignupForm"

type Props = {
  open: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
}

export function SignupModal({ open, onClose, onSwitchToLogin }: Props) {
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

      <SignupForm onSuccess={onClose} onSwitchToLogin={onSwitchToLogin} />
    </Modal>
  )
}
