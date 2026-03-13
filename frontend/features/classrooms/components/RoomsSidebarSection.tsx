'use client';

import { useState } from 'react';
import { useRooms } from '@/features/classrooms/hooks/useRooms';
import SidebarRooms from '@/features/student/components/SidebarRooms';

type RoomsSidebarSectionProps = {
  isCollapsed: boolean;
};

/**
 * RoomsSidebarSection - Feature component
 * 
 * Responsibilities:
 * - Fetch rooms data (useRooms)
 * - Handle room business logic
 * - Render presentation component (SidebarRooms)
 * 
 * This component owns its data and logic.
 * It can be used in any sidebar context.
 */
export default function RoomsSidebarSection({
  isCollapsed,
}: RoomsSidebarSectionProps) {
  const [query, setQuery] = useState('');

  // Data fetching - owned by this feature
  const { rooms, loading } = useRooms();

  // Business logic handlers
  const handleJoinRoom = () => {
    // TODO: Implement join room logic
    console.log('[RoomsSidebarSection] Join room');
  };

  const handleLeaveRoom = (roomId: string) => {
    // TODO: Implement leave room logic
    console.log('[RoomsSidebarSection] Leave room:', roomId);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRooms = normalizedQuery
    ? rooms.filter((room) => room.name.toLowerCase().includes(normalizedQuery))
    : rooms;

  // Render presentation component
  return (
    <SidebarRooms
      rooms={filteredRooms}
      searchQuery={query}
      onSearchQueryChange={setQuery}
      isCollapsed={isCollapsed}
      onJoinRoom={handleJoinRoom}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}
