'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/features/auth';
import { useNotification } from '@/lib/hooks/useNotification';
import { deleteAccount } from '@/features/auth/services/auth.service';
import { useChatStore } from '@/stores';
import { INTEREST_GROUPS, getInterestLabel, normalizeInterestIds } from '@/lib/constants/interests';
import { useRouter } from 'next/navigation';

type SettingsSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsSidebar({ open, onClose }: SettingsSidebarProps) {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const resetChat = useChatStore((state) => state.resetChat);
  const { success, error: errorToast } = useNotification();

  const { mutate: globalMutate } = useSWRConfig();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    email: '',
    birth_date: '',
    gender: '',
    interests: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Avatar state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Fetch profile from backend when modal opens - sempre atualizado
  useEffect(() => {
    if (!open) return;

    const loadProfileFromBackend = async () => {
      setIsLoadingProfile(true);
      setLoadError(null);
      setSelectedFile(null);
      setPreviewUrl(null);

      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setLoadError('Sessao expirada. Faca login novamente.');
            return;
          }

          console.warn('[SettingsSidebar] Profile API status:', response.status);
          setLoadError(`Erro ao carregar perfil (status ${response.status})`);
          return;
        }

        const profileData = await response.json();

        setFormData({
          full_name: profileData.full_name || profileData.name || '',
          nickname: profileData.nickname || '',
          email: profileData.email || '',
          birth_date: profileData.birth_date || '',
          gender: profileData.gender || '',
          interests: normalizeInterestIds(profileData.interests),
        });
      } catch (error) {
        console.error('[SettingsSidebar] Load error:', error);
        setLoadError('Erro ao carregar dados do perfil.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfileFromBackend();
  }, [open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  // 🔥 Nova função: Lidar com seleção de arquivo (só preview + validações)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (segurança)
    if (!file.type.startsWith('image/')) {
      errorToast('Arquivo inválido. Selecione uma imagem.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errorToast('Tipo de arquivo não permitido. Use PNG, JPG ou WEBP.');
      return;
    }

    // Validar tamanho (2MB - segurança)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      errorToast(`Arquivo muito grande. Máximo: 2MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setSelectedFile(file);

    // Criar preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 🔥 Função auxiliar: Limpar preview após salvar
  const clearAvatarPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteConfirmText('');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      errorToast('Digite sua senha para confirmar.');
      return;
    }

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      errorToast('Digite DELETE para confirmar a exclusão.');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAccount({
        password: deletePassword,
        confirmText: deleteConfirmText,
      });

      // Garante limpeza imediata de estado local antes do redirect.
      resetChat();
      setUser(null);
      await globalMutate(() => true);
      await logout();

      success('Conta excluída com sucesso!');
      closeDeleteModal();
      onClose();
      router.push('/');
    } catch (error: any) {
      errorToast(error?.message || 'Erro ao excluir conta');
      console.error('[SettingsSidebar] Delete account error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare FormData for file upload (profile_image if needed)
      const formBody = new FormData();
      formBody.append('full_name', formData.full_name);
      formBody.append('nickname', formData.nickname);
      formBody.append('email', formData.email);
      formBody.append('birth_date', formData.birth_date);
      formBody.append('gender', formData.gender);
      formBody.append('interests', JSON.stringify(formData.interests));

      // 🔥 Adicionar avatar se foi selecionado
      if (selectedFile) {
        formBody.append('profile_image', selectedFile);
      }

      // Call backend to update profile
      const response = await fetch('/api/user/update', {
        method: 'POST',
        credentials: 'include',
        body: formBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Update failed with status ${response.status}`);
      }

      const updatedProfile = await response.json();

      // 🎯 Atualiza contexto global imediatamente
      // Backend pode retornar { user: {...} } ou {...} diretamente
      const userObject = updatedProfile.user || updatedProfile;
      setUser(userObject);
      await globalMutate('/api/auth/me');

      // 🔥 Limpar preview após sucesso
      clearAvatarPreview();

      success('Perfil atualizado com sucesso!');
      onClose();
    } catch (error: any) {
      errorToast(error.message || 'Erro ao atualizar perfil');
      console.error('[SettingsSidebar] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const userInitial = formData.full_name?.charAt(0)?.toUpperCase() || 'U';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const avatarUrl = user?.profile_image 
    ? (user.profile_image.startsWith('http') 
        ? user.profile_image 
        : `${API_URL}${user.profile_image}`)
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[1500]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {loadError}
            </div>
          )}

          {isLoadingProfile && (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          )}

          {!isLoadingProfile && !loadError && (
            <>
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Perfil
                </h3>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                      {(previewUrl || avatarUrl) ? (
                        <img 
                          src={previewUrl || avatarUrl || ''} 
                          alt="Avatar" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-500">{userInitial}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preview</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Foto de Perfil
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedFile ? `✓ ${selectedFile.name}` : 'PNG, JPG ou WEBP (máx. 2MB)'}
                    </p>
                    {selectedFile && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          ℹ️ Clique em "Salvar Alterações" para aplicar o novo avatar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-900 dark:text-white"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apelido</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-900 dark:text-white"
                      value={formData.nickname}
                      onChange={(e) => handleChange('nickname', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-900 dark:text-white"
                      value={formData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                    />
                  </div>
                  <div className="w-full max-w-full min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gênero</label>
                    <select
                      className="block w-full max-w-full min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 pr-10 text-sm text-gray-900 dark:text-white"
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                    >
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-900 dark:text-white"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Interesses Acadêmicos
                </h3>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md max-h-80 overflow-y-auto custom-scrollbar space-y-6">
                  {INTEREST_GROUPS.map((group) => (
                    <div key={group.title}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">{group.title}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {group.itemIds.map((itemId) => (
                          <label key={itemId} className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="rounded text-blue-600 focus:ring-blue-500"
                              checked={formData.interests.includes(itemId)}
                              onChange={() => handleInterestToggle(itemId)}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">{getInterestLabel(itemId)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pt-4 border-t border-red-200 dark:border-red-900/30">
                <h3 className="text-lg font-medium text-red-600 mb-2">Zona de Perigo</h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors text-sm font-medium"
                >
                  Excluir minha conta permanentemente
                </button>
              </section>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !user}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </aside>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-red-600">Excluir conta</h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Esta acao e irreversivel. Para continuar, confirme sua senha e digite <strong>DELETE</strong>.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Senha atual</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Digite DELETE para confirmar</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
