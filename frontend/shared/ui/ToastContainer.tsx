'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToastStore } from '@/stores/useToastStore'

function ToastItem({ id, message, type }: { id: string; message: string; type: string }) {
  const { dismiss } = useToastStore()

  useEffect(() => {
    // Auto-dismiss para loading não funciona aqui pois vem do store
    return () => {}
  }, [id])

  const bgColor = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    loading: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  }[type] || 'bg-white dark:bg-gray-800'

  const textColor = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    loading: 'text-blue-800 dark:text-blue-200',
    info: 'text-blue-800 dark:text-blue-200',
  }[type] || 'text-gray-800 dark:text-gray-200'

  const icon = {
    success: (
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    loading: (
      <svg className="h-5 w-5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  }[type]

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${bgColor}`}
      role="alert"
      aria-live="polite"
    >
      <span className={textColor}>{icon}</span>
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={() => dismiss(id)}
        className={`flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
        aria-label="Fechar notificação"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [mounted, setMounted] = useState(false)
  const toasts = useToastStore((state) => state.toasts)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (toasts.length > 0) {
      console.log('[ToastContainer] Renderizando', toasts.length, 'toast(s):', toasts)
    }
  }, [toasts])

  if (!mounted) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end justify-start p-4 pt-8">
      <div className="flex max-w-sm flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>,
    document.body
  )
}
