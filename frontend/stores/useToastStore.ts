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
    return set((state) => {
      const id = `${Date.now()}-${Math.random()}`
      const newToasts = [...state.toasts, { id, message, type: 'success' as ToastType, duration }]
      console.log('[useToastStore] Toast adicionado ao state:', newToasts)
      
      setTimeout(() => {
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        }))
      }, duration)

      return { toasts: newToasts }
    }) || ''
  },

  error: (message, duration = 4000) =>
    set((state) => {
      const id = `${Date.now()}-${Math.random()}`
      const newToasts = [...state.toasts, { id, message, type: 'error' as ToastType, duration }]
      
      setTimeout(() => {
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        }))
      }, duration)

      return { toasts: newToasts }
    }) || '',

  loading: (message, duration) =>
    set((state) => {
      const id = `${Date.now()}-${Math.random()}`
      return { toasts: [...state.toasts, { id, message, type: 'loading' as ToastType, duration }] }
    }) || '',

  info: (message, duration = 3000) =>
    set((state) => {
      const id = `${Date.now()}-${Math.random()}`
      const newToasts = [...state.toasts, { id, message, type: 'info' as ToastType, duration }]
      
      setTimeout(() => {
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        }))
      }, duration)

      return { toasts: newToasts }
    }) || '',

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  dismissAll: () =>
    set(() => ({
      toasts: [],
    })),
}))
