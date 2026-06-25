/**
 * Sidebar Components
 * 
 * Arquitetura organizada da sidebar profissional
 * 
 * Estrutura:
 * - Sidebar: Container principal
 * - SidebarContent: Conteúdo scrollável
 * - SidebarHeader: Header (logo)
 * - SidebarFooter: Footer (perfil, logout)
 * - SidebarSection: Seção colapsável
 * - ConversationsList: Lista de conversas
 * - RoomsList: Lista de salas/turmas
 * 
 * Hooks:
 * - useSidebar: Gerencia estado de collapsed/mobile
 * 
 * Uso básico:
 * ```tsx
 * import Sidebar from '@/components/sidebar'
 * 
 * <Sidebar
 *   userName="João"
 *   userInitial="J"
 *   userRole="Estudante"
 *   footer={<ProfileMenu />}
 * />
 * ```
 */

export { default as Sidebar } from './Sidebar'
export type { SidebarProps } from './Sidebar'

export { default as SidebarContent } from './SidebarContent'
export type { SidebarContentProps } from './SidebarContent'

export { default as SidebarHeader } from './SidebarHeader'
export { default as SidebarFooter } from './SidebarFooter'
export type { SidebarFooterProps } from './SidebarFooter'

export { default as SidebarSection } from './SidebarSection'
export type { SidebarSectionProps } from './SidebarSection'

export { default as ConversationsList } from './conversations/ConversationsList'
export type { ConversationsListProps } from './conversations/ConversationsList'

export { default as ConversationItem } from './conversations/ConversationItem'
export type { ConversationItemProps } from './conversations/ConversationItem'

export { default as ConversationMenu } from './conversations/ConversationMenu'
export type { ConversationMenuProps } from './conversations/ConversationMenu'

export { default as RoomsList } from './rooms/RoomsList'
export type { RoomsListProps, Room } from './rooms/RoomsList'

export { default as RoomItem } from './rooms/RoomItem'
export type { RoomItemProps } from './rooms/RoomItem'

export { default as RoomMenu } from './rooms/RoomMenu'
export type { RoomMenuProps } from './rooms/RoomMenu'

export { useSidebar } from './hooks/useSidebar'
export type { UseSidebarReturn } from './hooks/useSidebar'
