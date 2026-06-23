"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  full_name: string;
  nickname?: string;
  email: string;
  role: string;
  profile_image?: string;
  interests?: string[];
  birth_date?: string;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * 🔐 AuthProvider - Arquitetura baseada em Cookies HttpOnly
 * 
 * ✅ Usa apenas Cookies HttpOnly (automaticamente enviados via credentials: "include")
 * ✅ NÃO depende de localStorage
 * ✅ NÃO usa Authorization header manual
 * ✅ Fornece refreshUser() para sincronizar após mutações
 * ✅ Aceita initialUser do servidor (SSR)
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);

  // Função para carregar usuário do backend (via cookies + credentials)
  const loadUserFromBackend = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include', // 🔑 Envia cookies automaticamente
      });

      if (!res.ok) {
        setUser(null);
        return false;
      }

      const payload = await res.json();
      const userData = payload?.user ?? payload;

      setUser(userData);
      return true;
    } catch (err) {
      console.error('[AuthContext] Erro ao carregar usuário:', err);
      setUser(null);
      return false;
    }
  };

  // Carrega usuário apenas se não houver initialUser do servidor
  useEffect(() => {
    if (initialUser) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      await loadUserFromBackend();
      setLoading(false);
    };

    loadUser();
  }, [initialUser]);

  // Expõe função para refresh manual após mutações (ex: atualizar perfil)
  const refreshUser = async () => {
    setLoading(true);
    try {
      await loadUserFromBackend();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
