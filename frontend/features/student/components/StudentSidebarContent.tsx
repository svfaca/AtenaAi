'use client'

import RoomsSidebarSection from '@/features/classrooms/components/RoomsSidebarSection'
import ConversationsSidebarSection from '@/features/conversations/components/ConversationsSidebarSection'

type StudentSidebarContentProps = {
  isCollapsed: boolean
}

/**
 * StudentSidebarContent - Composition component
 *
 * Composes multiple feature sections for the student sidebar.
 * Each feature manages its own data and logic.
 */
export default function StudentSidebarContent({
  isCollapsed,
}: StudentSidebarContentProps) {
  return (
    <>
      <RoomsSidebarSection isCollapsed={isCollapsed} />
      <ConversationsSidebarSection isCollapsed={isCollapsed} />
    </>
  )
}
