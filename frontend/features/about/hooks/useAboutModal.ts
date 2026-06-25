'use client'

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type AboutModalContextValue = {
  isOpen: boolean
  openAbout: () => void
  closeAbout: () => void
}

const AboutModalContext = createContext<AboutModalContextValue | null>(null)

export function AboutModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openAbout = useCallback(() => setIsOpen(true), [])
  const closeAbout = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({
      isOpen,
      openAbout,
      closeAbout,
    }),
    [closeAbout, isOpen, openAbout],
  )

  return createElement(AboutModalContext.Provider, { value }, children)
}

export function useAboutModal() {
  const context = useContext(AboutModalContext)

  if (!context) {
    throw new Error('useAboutModal must be used within AboutModalProvider')
  }

  return context
}