'use client';

import { LoginModal } from './LoginModal';
import { SignupModal } from './SignupModal';
import { useAuth } from './AuthContext';

export function AuthModals() {
  const { loginModalOpen, signupModalOpen, closeLogin, closeSignup } = useAuth();

  return (
    <>
      <LoginModal
        isOpen={loginModalOpen}
        onClose={closeLogin}
      />
      <SignupModal
        isOpen={signupModalOpen}
        onClose={closeSignup}
      />
    </>
  );
}
