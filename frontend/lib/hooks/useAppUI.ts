"use client";

import { create } from 'zustand';

/**
 * useUIStore - Pure UI state only
 * 
 * ⚠️ IMPORTANT: Only UI-related state here!
 * 
 * ALLOWED:
 * - Sidebar collapsed/open
 * - Modal open/closed
 * - Theme dark/light
 * - Panel visibility
 * 
 * NOT ALLOWED (use domain stores):
 * - selectedConversation → useChatStore
 * - selectedRoom → useRoomStore
 * - messages → useChatStore
 * - notifications → useNotificationStore
 * 
 * This separation prevents the store from becoming a "mega store"
 */

interface UIState {
  // Sidebar state
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  
  // Settings panel
  isSettingsOpen: boolean;
  
  // Actions
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isSidebarCollapsed: true,
  isMobileSidebarOpen: false,
  isSettingsOpen: false,
  
  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  collapseSidebar: () => set({ isSidebarCollapsed: true }),
  expandSidebar: () => set({ isSidebarCollapsed: false }),
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  
  // Settings actions
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));

// Backward compatibility alias
// TODO: Remove after migrating all components to useUIStore
export const useAppUI = useUIStore;
