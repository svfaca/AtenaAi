'use client'

import { useState, useCallback } from 'react'

/**
 * useSidebar
 * 
 * Gerencia estado da sidebar (collapsed e mobile)
 * Único lugar centralizado para lógica de UI da sidebar
 * 
 * Responsabilidades:
 * - Estado de collapsed/expanded (desktop)
 * - Estado de mobile (aberto/fechado)
 * - Callbacks para abrir/fechar
 * 
 * Benefíciosː
 * ✓ Evita duplicação de estado
 * ✓ Fácil de testar
 * ✓ Reutilizável em múltiplos componentes
 * ✓ Não depende de store externo
 */
export interface UseSidebarReturn {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapsed: () => void
  openMobile: () => void
  closeMobile: () => void
  toggleMobile: () => void
}

export function useSidebar(): UseSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const openMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
    toggleMobile,
  }
}
