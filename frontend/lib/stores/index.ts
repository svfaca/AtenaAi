/**
 * Zustand Stores - Domain-separated state management
 * 
 * Architecture:
 * - useUIStore: Pure UI state (sidebar, modals, theme)
 * - useChatStore: Chat domain (conversations, messages, draft)
 * 
 * Future stores:
 * - useRoomStore: Room domain (selected room, room state)
 * - useNotificationStore: Notifications domain
 */

export { useUIStore, useAppUI } from '../hooks/useAppUI';
export { useChatStore } from './useChatStore';
