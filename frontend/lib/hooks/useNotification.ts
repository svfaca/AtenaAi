'use client'

import { useToastStore, type ToastType } from '@/stores/useToastStore'

export function useNotification() {
  const { success, error, loading, info, dismiss, dismissAll } = useToastStore()

  return {
    success,
    error,
    loading,
    info,
    dismiss,
    dismissAll,
  }
}
