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
    const id = `${Date.now()}-${Math.random()}`

    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'success', duration }],
    }))

    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }))
    }, duration)

    return id
  },

  error: (message, duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`

    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'error', duration }],
    }))

    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }))
    }, duration)

    return id
  },

  loading: (message, duration) => {
    const id = `${Date.now()}-${Math.random()}`

    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'loading', duration }],
    }))

    return id
  },

  info: (message, duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`

    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'info', duration }],
    }))

    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }))
    }, duration)

    return id
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  dismissAll: () =>
    set(() => ({
      toasts: [],
    })),
}))
