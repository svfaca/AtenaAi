"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ open, onClose, children, maxWidth = "md" }: Props) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevenir scroll do body quando modal está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (open) {
      window.addEventListener("keydown", handleEsc)
    }

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [open, onClose])

  if (!open || !isMounted) return null

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[maxWidth]

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`relative z-[10000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-full ${maxWidthClass} animate-in fade-in zoom-in duration-200 pointer-events-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
