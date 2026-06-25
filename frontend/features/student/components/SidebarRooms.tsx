'use client';

import { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import type { Classroom } from '@/lib/types';

type SidebarRoomsProps = {
  rooms: Classroom[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isCollapsed: boolean;
  onJoinRoom: () => void;
  onLeaveRoom: (roomId: string) => void;
  onOpenRoom: (roomId: string) => void;
};

export default function SidebarRooms({
  rooms,
  searchQuery,
  onSearchQueryChange,
  isCollapsed,
  onJoinRoom,
  onLeaveRoom,
  onOpenRoom,
}: SidebarRoomsProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setActiveMenuId(null));

  const toggleMenu = useCallback((roomId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    if (activeMenuId === roomId) {
      setActiveMenuId(null);
      setMenuPosition(null);
      return;
    }

    // Calcular posição do menu baseado no botão
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: buttonRect.bottom + 4,
      left: buttonRect.left - 192 + buttonRect.width, // 192px = w-48
    });
    
    setActiveMenuId(roomId);
  }, [activeMenuId]);

  const handleLeaveRoom = (roomId: string) => {
    onLeaveRoom(roomId);
    setActiveMenuId(null);
  };

  return (
    <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between px-2">
        <h3
          className={`text-xs font-bold uppercase tracking-wider text-gray-500 ${
            isCollapsed ? 'md:hidden' : 'block'
          }`}
        >
          Salas
        </h3>
        {!isCollapsed && (
          <button
            onClick={onJoinRoom}
            className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
            aria-label="Entrar em sala"
          >
            Entrar em sala
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="mb-2 px-2">
          <input
            placeholder="Buscar sala..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {isCollapsed ? (
        <div className="flex justify-center">
          <button
            onClick={onJoinRoom}
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Salas"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 10h1m4 0h1m-6 4h1m4 0h1"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {rooms.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">Nenhuma sala ainda</p>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="group relative">
                <div
                  onClick={() => onOpenRoom(room.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 10h1m4 0h1m-6 4h1m4 0h1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span className="flex-1 truncate">{room.name}</span>
                  {room.status === 'pending' && (
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      Aguardando
                    </span>
                  )}
                  <button
                    onClick={(e) => toggleMenu(room.id, e)}
                    className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-300 group-hover:opacity-100 dark:hover:bg-gray-600"
                    aria-label="Menu"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                {activeMenuId === room.id && menuPosition && (
                  <div
                    ref={menuRef}
                    style={{
                      position: 'fixed',
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`,
                    }}
                    className="z-[999] w-48 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-2xl"
                  >
                    <button
                      onClick={() => handleLeaveRoom(room.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-gray-700"
                    >
                      {room.status === 'pending'
                        ? 'Cancelar solicitacao de entrada'
                        : 'Sair da sala'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
