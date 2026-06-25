'use client';

import { useState, useEffect } from 'react';
import type { Classroom } from '@/lib/types';

interface UseRoomsReturn {
  rooms: Classroom[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRooms(): UseRoomsReturn {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/classrooms', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[useRooms] API error:', response.status);
        setRooms([]);
        setError(`HTTP ${response.status}: ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Handle different response structures
      if (Array.isArray(data)) {
        setRooms(data)
      } else if (data && data.data && Array.isArray(data.data)) {
        setRooms(data.data)
      } else {
        console.warn('[useRooms] Unexpected response structure:', data)
        setRooms([])
      }
    } catch (err) {
      console.error('[useRooms] Error fetching classrooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load classrooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
  };
}
