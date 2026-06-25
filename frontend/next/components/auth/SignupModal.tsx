'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTERESTS_BY_CATEGORY = {
  'Exatas e Tecnologia': ['Matemática', 'Estatística', 'Física', 'Química', 'Programação', 'Engenharia'],
  'Biológicas e Saúde': ['Biologia', 'Saúde', 'Anatomia', 'Ed. Física'],
  'Humanas': ['História', 'Geografia', 'Filosofia', 'Sociologia', 'Psicologia'],
  'Linguagens': ['Literatura', 'Idiomas', 'Redação'],
  'Aplicadas e Profissionais': ['Direito', 'Economia', 'Artes'],
  'Acadêmico e Produtividade': ['Pesquisa', 'Estudos'],
};

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openLogin } = useAuth();

  // Validar formato de email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Verificar se email já existe
  const checkEmailExists = async (email: string) => {
    if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    setCheckingEmail(true);
    setEmailError('');

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.available) {
        setEmailError('Email já em uso');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Erro ao verificar email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Validar formato
    if (newEmail && !isValidEmail(newEmail)) {
      setEmailError('Formato de email inválido');
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (email && isValidEmail(email)) {
      checkEmailExists(email);
    } else if (!email) {
      setEmailError('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        toast.error('Preencha todos os campos');
        return;
      }

      if (!isValidEmail(email)) {
        toast.error('Formato de email inválido');
        return;
      }

      if (emailError) {
        toast.error('❌ ' + emailError + ' Utilize outro email ou faça login se já tem uma conta');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }

      if (password.length < 6) {
        toast.error('Senha deve ter no mínimo 6 caracteres');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!name) {
        toast.error('Nome é obrigatório');
        return;
      }
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!agreedToPrivacy) {
      toast.error('Você precisa concordar com a Política de Privacidade');
      return;
    }

    if (selectedInterests.length === 0) {
      toast.error('Selecione pelo menos um interesse');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        email,
        password,
        name,
        nickname: nickname || undefined,
        birth_date: birthDate || undefined,
        gender: gender || undefined,
        interests: selectedInterests,
        profile_image: profileImagePreview || undefined,
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar conta');
      }

      toast.success('Conta criada com sucesso!');
      // Novos usuários são alunos por padrão, então redirecionar para /scholar
      router.push('/scholar');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    onClose();
    setTimeout(() => openLogin(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Criar Conta</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Passo {step} de 3</p>
          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Email & Senha */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                      : email && isValidEmail(email) && !checkingEmail && !emailError
                      ? 'border-green-500 dark:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="seu@email.com"
                />
                {checkingEmail && (
                  <span className="absolute right-3 top-2.5 text-gray-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                )}
                {!checkingEmail && emailError && (
                  <span className="absolute right-3 top-2.5 text-red-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101a.75.75 0 10-1.060-1.061l-1.102 1.101a2.5 2.5 0 11-3.536-3.536l4-4a2.5 2.5 0 013.536 0l1.102-1.101a.75.75 0 10-1.061-1.06l-1.102 1.1z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {!checkingEmail && email && isValidEmail(email) && !emailError && (
                  <span className="absolute right-3 top-2.5 text-green-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        {/* Step 2: Perfil */}
        {step === 2 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Foto de Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de Perfil (Opcional)
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Selecionar foto
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apelido (Opcional)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Como quer ser chamado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sexo (Opcional)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
                <option value="N">Prefiro não dizer</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Interesses */}
        {step === 3 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Selecione seus Interesses
              </label>

              {Object.entries(INTERESTS_BY_CATEGORY).map(([category, interests]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{category}</h3>
                  <div className="space-y-2">
                    {interests.map((interest) => (
                      <label key={interest} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Eu concordo com a{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                    Política de Privacidade
                  </a>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={handlePreviousStep}
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={isLoading || (step === 1 && emailError ? true : false)}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Já tem conta?{' '}
          <button
            onClick={handleSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Fazer login
          </button>
        </p>
      </div>
    </div>
  );
}
