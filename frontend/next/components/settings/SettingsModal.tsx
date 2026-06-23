"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";

const INTERESTS = [
  "Matemática",
  "Estatística",
  "Física",
  "Química",
  "Programação",
  "Engenharia",
  "Biologia",
  "Saúde",
  "Anatomia",
  "Ed. Física",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Psicologia",
  "Literatura",
  "Idiomas",
  "Redação",
  "Direito",
  "Economia",
  "Artes",
  "Pesquisa",
  "Estudos"
];

export function SettingsModal({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, setUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para manter os dados sincronizados
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    email: "",
    birth_date: "",
    gender: ""
  });

  // Sincronizar dados quando o modal abre
  useEffect(() => {
    if (isOpen && user) {
      console.log("USER:", user);
      console.log("USER INTERESTS:", user?.interests, "TYPE:", typeof user?.interests);
      
      setFormData({
        full_name: user.full_name || "",
        nickname: user.nickname || "",
        email: user.email || "",
        birth_date: user.birth_date || "",
        gender: user.gender || ""
      });
      
      // 🔥 Parse robusto para todos os formatos
      let interests: string[] = [];

      if (Array.isArray(user.interests)) {
        interests = user.interests;
      } else if (typeof user.interests === "string" && user.interests.trim()) {
        try {
          // Tenta JSON primeiro
          const parsed = JSON.parse(user.interests);
          if (Array.isArray(parsed)) {
            interests = parsed;
          } else {
            // Se não for array, tenta CSV
            interests = user.interests.split(",").map(i => i.trim()).filter(i => i);
          }
        } catch {
          // Se JSON falhar, trata como CSV
          interests = user.interests.split(",").map(i => i.trim()).filter(i => i);
        }
      }

      console.log("INTERESSES PARSEADOS:", interests);
      setSelectedInterests(interests);
      
      setProfileImagePreview(null);
      setError(null);
      setSuccess(null);
      setHasChanges(false);
    }
  }, [isOpen, user]);

  // Detectar mudanças nos dados
  useEffect(() => {
    if (!user) return;

    // 🔥 Parse robusto para consistência
    let initialInterests: string[] = [];

    if (Array.isArray(user.interests)) {
      initialInterests = user.interests;
    } else if (typeof user.interests === "string" && user.interests.trim()) {
      try {
        const parsed = JSON.parse(user.interests);
        if (Array.isArray(parsed)) {
          initialInterests = parsed;
        } else {
          initialInterests = user.interests.split(",").map(i => i.trim()).filter(i => i);
        }
      } catch {
        initialInterests = user.interests.split(",").map(i => i.trim()).filter(i => i);
      }
    }

    const changed =
      formData.full_name !== (user.full_name || "") ||
      formData.nickname !== (user.nickname || "") ||
      formData.birth_date !== (user.birth_date || "") ||
      formData.gender !== (user.gender || "") ||
      JSON.stringify(selectedInterests.sort()) !== JSON.stringify(initialInterests.sort()) ||
      profileImagePreview !== null;

    setHasChanges(changed);
  }, [formData, selectedInterests, profileImagePreview, user]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
            <p className="text-slate-600 dark:text-slate-300">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-2xl">
          <p className="text-red-600 dark:text-red-400">Usuário não encontrado</p>
          <button
            onClick={onClose}
            className="mt-4 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 rounded font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = new FormData();
      submitData.set("full_name", formData.full_name);
      submitData.set("nickname", formData.nickname);
      submitData.set("birth_date", formData.birth_date);
      submitData.set("gender", formData.gender);
      submitData.set("interests", JSON.stringify(selectedInterests));

      // Adicionar imagem se foi alterada
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        submitData.set("profile_image", fileInput.files[0]);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/auth/update-profile`, {
        method: "PUT",
        credentials: "include", // 🔑 Envia cookies automaticamente
        body: submitData
      });

      if (res.ok) {
        setSuccess("Perfil atualizado com sucesso!");
        
        // 🔄 Sincroniza dados do usuário com o backend
        await refreshUser();
        
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao atualizar perfil");
      }
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("⚠️ Tem certeza? Esta ação é irreversível e deletará sua conta permanentemente.")) {
      return;
    }

    if (!window.confirm("Digite 'DELETAR' para confirmar... Será mesmo?")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/auth/delete-account`, {
        method: "DELETE",
        credentials: "include" // 🔑 Envia cookies automaticamente
      });

      if (res.ok) {
        setUser(null);
        onClose();
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao deletar conta");
      }
    } catch (err) {
      console.error("Erro ao deletar conta:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setDeleting(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configurações da Conta</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form className="space-y-6">
            {/* Foto de Perfil */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : user.profile_image ? (
                    <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.full_name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    name="profile_image"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition text-sm"
                  >
                    Alterar Foto
                  </button>
                </div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Apelido
                  </label>
                  <input
                    name="nickname"
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 rounded px-3 py-2 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email não pode ser alterado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gênero
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                    <option value="N">Prefiro não dizer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interesses */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Áreas de Interesse</h3>
              <input type="hidden" name="interests" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      selectedInterests.includes(interest)
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(interest)}
                      onChange={() => toggleInterest(interest)}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-medium ${
                      selectedInterests.includes(interest)
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {interest}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Selecionados: {selectedInterests.length}
              </p>
            </div>


          </form>

          {/* Zona de Perigo - Delete Account */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">🔴 Zona de Perigo</h3>
              <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                Deletar sua conta é uma ação permanente e não pode ser desfeita. Todos os seus dados serão perdidos.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 transition"
              >
                {deleting ? "Deletando..." : "Deletar Minha Conta"}
              </button>
            </div>
          </div>
        </div>

        {/* Botão Flutuante - Salvar Alterações (só aparece com mudanças) */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-75"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
