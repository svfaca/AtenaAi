'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  loginModalOpen: boolean;
  signupModalOpen: boolean;
  openLogin: () => void;
  openSignup: () => void;
  closeLogin: () => void;
  closeSignup: () => void;
  closeAll: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  const openLogin = () => {
    setLoginModalOpen(true);
    setSignupModalOpen(false);
  };

  const openSignup = () => {
    setSignupModalOpen(true);
    setLoginModalOpen(false);
  };

  const closeLogin = () => setLoginModalOpen(false);
  const closeSignup = () => setSignupModalOpen(false);
  const closeAll = () => {
    setLoginModalOpen(false);
    setSignupModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        loginModalOpen,
        signupModalOpen,
        openLogin,
        openSignup,
        closeLogin,
        closeSignup,
        closeAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
