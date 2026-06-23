'use client'

import { useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useAboutModal } from '../hooks/useAboutModal'
import { AboutPublic } from './contextual/AboutPublic'
import { AboutStudent } from './contextual/AboutStudent'
import { AboutUser } from './contextual/AboutUser'

type AboutModalProps = {
  open?: boolean
  onClose?: () => void
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  const { isOpen, closeAbout } = useAboutModal()
  const { user } = useAuth()
  const isControlled = typeof open === 'boolean' && typeof onClose === 'function'
  const modalOpen = isControlled ? open : isOpen
  const handleClose = isControlled ? onClose : closeAbout

  useEffect(() => {
    if (!modalOpen) {
      return undefined
    }

    // Only handle ESC key - no need to manage body overflow since About is now in layout flow
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose?.()
      }
    }

    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [handleClose, modalOpen])

  if (!modalOpen) {
    return null
  }

  const isStudent = user?.role === 'student'

  const renderContent = () => {
    if (!user) {
      return <AboutPublic />
    }

    if (isStudent) {
      return <AboutStudent />
    }

    return <AboutUser />
  }

  return (
    <div
      className="flex flex-1 flex-col min-h-0 overflow-hidden border-t border-slate-200 bg-slate-50 text-gray-900 dark:border-slate-700 dark:bg-slate-950 dark:text-gray-100"
      role="dialog"
      aria-modal="true"
      aria-label="Sobre a AtenaAI"
    >
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  )
}