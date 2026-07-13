'use client'

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'loading' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  
  addToast: (message: string, type: ToastType, duration?: number) => string
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  loading: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type, duration) => {
    const id = `${Date.now()}-${Math.random()}`
    
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))

    // Auto-dismiss se tiver duration
    if (duration && duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }

    return id
  },

  success: (message, duration = 3000) => {
    console.log('[useToastStore] success() chamado com:', message)
    return useToastStore.getState().addToast(message, 'success', duration)
  },

  error: (message, duration = 4000) => useToastStore.getState().addToast(message, 'error', duration),

  loading: (message, duration) => useToastStore.getState().addToast(message, 'loading', duration),

  info: (message, duration = 3000) => useToastStore.getState().addToast(message, 'info', duration),

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  dismissAll: () =>
    set(() => ({
      toasts: [],
    })),
}))
