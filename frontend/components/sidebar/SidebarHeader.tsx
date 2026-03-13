'use client'

/**
 * SidebarHeader - Header da sidebar (apenas logo/título)
 * 
 * Responsabilidades:
 * - Mostrar logo/branding
 * - Novo botão (+ conversas)
 * 
 * Nota: O avatar+nome está em Sidebar.tsx
 * Este component é para o espaço acima do scroll se necessário
 * 
 * Pode ser removido ou expandido conforme necessário
 */
export default function SidebarHeader() {
  return (
    <div className="shrink-0 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
        AtenaAI
      </h2>
    </div>
  )
}
