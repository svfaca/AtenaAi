import { getState, setState, logout } from "../store.js";
import { API_V1_URL } from "../core/config.js";

const getAuthToken = () => getState().token;
const getUser = () => getState().user;
const setUser = (user) => setState({ user, role: user?.role || null });

function updateAvatarUI() {
    const user = getUser();
    console.log("[updateAvatarUI] User data:", user);
    
    if (!user) {
        console.warn("[updateAvatarUI] Nenhum usuário encontrado");
        return;
    }

    const els = {
        avatarImage: document.getElementById("avatar-image"),
        avatarInitial: document.getElementById("avatar-initial"),
        userName: document.getElementById("user-name"),
        userRole: document.getElementById("user-role"),
        headerImg: document.getElementById("header-avatar-image"),
        headerInitial: document.getElementById("header-avatar-initial")
    };

    // ✅ Priorizar: nickname → full_name → email (não "Minha Conta")
    const displayName = user.nickname || user.full_name || user.email || "Usuário";
    console.log("[updateAvatarUI] Display name:", displayName);
    
    if (els.userName) {
        els.userName.textContent = displayName;
    }

    // ✅ Priorizar: role → account_type → "Aluno"
    const displayRole = user.role || user.account_type || "Aluno";
    if (els.userRole) {
        els.userRole.textContent = displayRole;
    }

    const setAvatar = (imgEl, initEl) => {
        if (!imgEl || !initEl) return;

        if (user.profile_image) {
            imgEl.src = user.profile_image;
            imgEl.classList.remove("hidden");
            initEl.classList.add("hidden");
        } else {
            initEl.textContent = (displayName || "U")[0].toUpperCase();
            imgEl.classList.add("hidden");
            initEl.classList.remove("hidden");
        }
    };

    setAvatar(els.avatarImage, els.avatarInitial);
    setAvatar(els.headerImg, els.headerInitial);
}

async function loadUserDataFromServer() {
    // ⚠️ Usar cookies em vez de Bearer token
    console.log("[loadUserDataFromServer] Iniciando...");
    
    const res = await fetch(`${API_V1_URL}/auth/me`, {
        credentials: 'include'  // Envia cookies automaticamente
    });

    console.log("[loadUserDataFromServer] Response status:", res.status);

    if (!res.ok) {
        console.warn("[loadUserDataFromServer] Falha ao carregar /auth/me:", res.status);
        return null;
    }
    
    const data = await res.json();
    console.log("[loadUserDataFromServer] Dados recebidos:", {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        nickname: data.nickname,
        role: data.role
    });
    
    setUser(data);
    return data;
}

const state = {
    currentConversationId: null,
    pendingActionId: null
};
async function apiRequest(path, options = {}) {
    // ⚠️ Usar cookies em vez de Bearer token
    const res = await fetch(`${API_V1_URL}${path}`, {
        credentials: 'include',  // Envia cookies automaticamente
        headers: {
            ...options.headers
        },
        ...options
    });

    if (!checkAuth(res)) return null;
    return res.json();
}


function renderWelcomeMessage() {
    let welcomeText = null;

    if (typeof t === 'function') {
        try { welcomeText = t('messages.welcome'); } catch (e) { welcomeText = null; }
    }

    // Se a tradução ainda não estiver disponível, usa um fallback baseado no idioma
    if (!welcomeText || welcomeText === 'messages.welcome') {
        const lang = (typeof getLanguage === 'function') ? getLanguage() : 'pt-BR';
        if (lang && lang.startsWith('en')) {
            welcomeText = "Hello! I'm AtenaAI.\n\nHow can I help you with your studies today?";
        } else {
            welcomeText = "Olá! Eu sou a AtenaAI.\n\nComo posso ajudar nos seus estudos hoje?";
        }
    }

    const parts = welcomeText.split('\n\n');
    const first = parts.shift() || '';
    const rest = parts.join('\n\n');
    return `
    <div class="flex justify-start mb-4 welcome-msg">
        <div class="max-w-[85%] bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm border border-blue-100 dark:border-blue-900/30">
            <p class="font-semibold mb-1"><strong>${first}</strong></p>
            <p class="text-sm">${rest}</p>
        </div>
    </div>`;
}

// Ao carregar traduções, re-renderiza mensagens de boas-vindas presentes na tela
document.addEventListener('i18n:loaded', () => {
    try {
        if (!chatMessages) return;
        chatMessages.querySelectorAll('.welcome-msg').forEach(el => {
            el.outerHTML = renderWelcomeMessage();
        });
    } catch (e) { /* silenciar erros */ }
});

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatMessages = document.getElementById("chat-messages");
const conversationList = document.getElementById("conversation-list");
const sendBtn = document.getElementById("send-btn");
const conversationSearchInput = document.getElementById("conversation-search");
let conversationsCache = [];

// ========================================================
// 🛡️ AUXILIARES DE UI E SEGURANÇA
// ========================================================

function checkAuth(res) {
    if (res.status === 401) { logout(); return false; }
    return true;
}

function setLoading(isLoading) {
    if (!input || !sendBtn) return;
    input.disabled = isLoading;
    sendBtn.disabled = isLoading;
    if (isLoading) {
        const typingDiv = document.createElement("div");
        typingDiv.id = "ai-typing";
        typingDiv.className = "flex justify-start mb-4";
        typingDiv.innerHTML = `<div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex gap-1 items-center shadow-sm"><span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span></div>`;
        chatMessages.appendChild(typingDiv);
    } else {
        document.getElementById("ai-typing")?.remove();
        input.focus();
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========================================================
// 📂 GESTÃO DE CONVERSAS (SIDEBAR)
// ========================================================

async function loadConversations() {
    const token = getAuthToken();
    if (!token || !conversationList) {
        console.warn('[CONVERSATIONS] Missing token or conversationList element');
        return;
    }

    try {
        console.log('[CONVERSATIONS] Fetching conversations from:', `${API_V1_URL}/conversations/`);
        const res = await fetch(`${API_V1_URL}/conversations/`, {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
            cache: 'no-store'
        });
        
        if (!checkAuth(res)) {
            console.warn('[CONVERSATIONS] Auth check failed');
            return;
        }
        
        if (!res.ok) {
            console.error('[CONVERSATIONS] Failed to load conversations - Status:', res.status);
            return;
        }
        
        const data = await res.json();
        console.log('[CONVERSATIONS] Raw data received:', data);
        
        const convs = Array.isArray(data) ? data : (data.items || []);
        conversationsCache = convs;
        console.log('[CONVERSATIONS] Parsed conversations count:', convs.length);
        renderConversationList();
    } catch (e) {
        console.error('[CONVERSATIONS] Error loading conversations:', e.message, e);
    }
}

function renderConversationList() {
    if (!conversationList) return;

    const searchTerm = (conversationSearchInput?.value || '').trim().toLowerCase();
    const filtered = searchTerm
        ? conversationsCache.filter(c => (c.title || '').toLowerCase().includes(searchTerm))
        : conversationsCache;

    const newHTML = filtered.length === 0 ? '' : filtered.map(c => {
        const safeTitle = (c.title || 'Conversa').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const dateStr = new Date(c.updated_at || c.created_at).toLocaleDateString('pt-BR');

        return `
        <li class="conv-item-container relative group" data-id="${c.id}">
            <a href="?c=${c.id}" class="btn-load-conv flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${state.currentConversationId == c.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">${safeTitle}</p>
                    <p class="text-xs text-gray-500">${dateStr}</p>
                </div>
            </a>
            
            <button class="dots-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all z-20 opacity-0 group-hover:opacity-100">
                <svg class="w-4 h-4 text-gray-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
            </button>

            <div id="menu-${c.id}" class="conv-options-menu shadow-xl border border-gray-200 dark:border-gray-700 rounded-md py-1 z-50 min-w-[120px] absolute right-2 top-10 bg-white dark:bg-gray-800">
                <button class="btn-duplicate w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs" data-id="${c.id}">Duplicar</button>
                <button class="btn-rename w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs" data-id="${c.id}" data-title="${safeTitle}">Renomear</button>
                <button class="btn-delete w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-xs" data-id="${c.id}">Excluir</button>
            </div>
        </li>
    `; }).join('');

    if (conversationList.innerHTML !== newHTML) {
        conversationList.style.opacity = '0.5';
        setTimeout(() => {
            conversationList.innerHTML = newHTML;
            conversationList.style.opacity = '1';
        }, 100);
    }
}

conversationSearchInput?.addEventListener('input', renderConversationList);

// ========================================================
// 🕹️ DELEGATION DE EVENTOS (ABRE MENU E TRATA AÇÕES)
// ========================================================

document.addEventListener('click', async (e) => {
    const token = getAuthToken();
    const target = e.target;

    // 1. Botão Sair (Corrigido para garantir prioridade)
    if (target.closest('#logout-btn') || target.closest('#collapsed-logout')) {
        e.preventDefault();
        logout();
        return;
    }

    // 2. Clique nos 3 pontos (Toggle Menu via classe .active do seu CSS)
    if (target.closest('.dots-btn')) {
        e.stopPropagation();
        const container = target.closest('.conv-item-container');
        const menu = document.getElementById(`menu-${container.dataset.id}`);
        
        const isCurrentlyActive = menu.classList.contains('active');
        
        // Fecha todos os menus abertos
        document.querySelectorAll('.conv-options-menu').forEach(m => m.classList.remove('active'));
        
        // Abre apenas se estava fechado
        if (!isCurrentlyActive) menu.classList.add('active');
        return;
    }

    // 3. Clique fora fecha menus
    if (!target.closest('.conv-options-menu')) {
        document.querySelectorAll('.conv-options-menu').forEach(m => m.classList.remove('active'));
    }

    // 4. Carregar Conversa ao clicar no item
    if (target.closest('.btn-load-conv')) {
        e.preventDefault();
        const id = target.closest('.conv-item-container').dataset.id;
        loadConversationById(id);
        return;
    }

    // 5. Ação: Duplicar
    if (target.closest('.btn-duplicate')) {
        const id = target.dataset.id;
        const res = await fetch(`${API_V1_URL}/conversations/${id}/duplicate`, { 
            method: 'POST', 
            credentials: 'include'
        });
        if (res.ok) loadConversations();
    }

    // 6. Ação: Abrir Modal Renomear
    if (target.closest('.btn-rename')) {
    state.pendingActionId = target.dataset.id;
    document.getElementById('rename-input').value = target.dataset.title;
    document.getElementById('rename-modal').classList.remove('hidden');
    document.getElementById('rename-modal-overlay').classList.add('active');
}


    // 7. Ação: Abrir Modal Excluir
    if (target.closest('.btn-delete')) {
    state.pendingActionId = target.dataset.id;
    document.getElementById('confirm-modal').classList.remove('hidden');
    document.getElementById('confirm-modal-overlay').classList.add('active');
}

});

// ========================================================
// 💬 CHAT CORE (ENVIO E CARREGAMENTO)
// =======
// ===============================================

function renderWelcomeNode() {
    let welcomeText = null;

    if (typeof t === 'function') {
        try { welcomeText = t('messages.welcome'); } catch {}
    }

    if (!welcomeText || welcomeText === 'messages.welcome') {
        const lang = typeof getLanguage === 'function' ? getLanguage() : 'pt-BR';
        welcomeText = lang?.startsWith('en')
            ? "Hello! I'm AtenaAI.\n\nHow can I help you with your studies today?"
            : "Olá! Eu sou a AtenaAI.\n\nComo posso ajudar nos seus estudos hoje?";
    }

    const parts = welcomeText.split('\n\n');
    const first = parts.shift() || '';
    const rest = parts.join('\n\n');

    const wrapper = document.createElement("div");
    wrapper.className = "flex justify-start mb-4 welcome-msg";

    const bubble = document.createElement("div");
    bubble.className = "max-w-[85%] bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm border border-blue-100 dark:border-blue-900/30";

    const p1 = document.createElement("p");
    p1.className = "font-semibold mb-1";
    p1.innerHTML = `<strong>${first}</strong>`;

    const p2 = document.createElement("p");
    p2.className = "text-sm";
    p2.textContent = rest;

    bubble.appendChild(p1);
    bubble.appendChild(p2);
    wrapper.appendChild(bubble);

    return wrapper;
}


async function loadConversationById(id) {
    const token = getAuthToken();
    try {
        setLoading(true);
        const res = await fetch(`${API_V1_URL}/conversations/${id}`, { 
            credentials: 'include'
        });
        if (!checkAuth(res)) return;

        if (!res.ok) {
            console.error('[CONVERSATIONS] Failed to load conversation', id, 'Status:', res.status);
            return;
        }
        
        const data = await res.json();
        const messages = Array.isArray(data?.messages)
            ? data.messages
            : (Array.isArray(data?.items) ? data.items : []);

        state.currentConversationId = data?.conversation?.id || id;

        chatMessages.innerHTML = "";
        chatMessages.appendChild(renderWelcomeNode());

        messages.forEach(m => {
            appendMessage(m.content, m.role === 'user');
        });

        if (messages.length === 0) {
            console.warn('[CONVERSATIONS] Conversation loaded but no messages returned', id);
        }

        loadConversations();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
        console.error('[CONVERSATIONS] Error loading conversation by id:', id, err);
    } finally { setLoading(false); }
}

function startNewChat() {
    state.currentConversationId = null;

chatMessages.innerHTML = "";
chatMessages.appendChild(renderWelcomeNode());
    loadConversations();
}

// Suporte ao Enter para enviar, Ctrl+Enter para nova linha
if (input) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            // Enter sem modificadores: enviar mensagem
            e.preventDefault();
            if (!input.disabled && input.value.trim()) {
                form.requestSubmit();
            }
        } else if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter: inserir quebra de linha
            e.preventDefault();
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;
            input.value = value.substring(0, start) + '\n' + value.substring(end);
            input.selectionStart = input.selectionEnd = start + 1;
            // Trigger resize
            input.dispatchEvent(new Event('input'));
        }
    });
}

form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || input.disabled) return;
    const token = getAuthToken();

appendMessage(text, true);
    input.value = ""; input.style.height = 'auto'; chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setLoading(true);
    try {
        const res = await fetch(`${API_V1_URL}/chat/`, {
            method: "POST",
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, content: text, conversation_id: state.currentConversationId, language: (typeof getLanguage === 'function' ? getLanguage() : 'pt-BR') })
        });
        if (!checkAuth(res)) return;
        
        if (!res.ok) {
            let errorMsg = 'Erro ao enviar mensagem.';
            try {
                const errData = await res.json();
                errorMsg = errData.detail || errorMsg;
            } catch { /* response is not JSON */ }
            if (res.status === 429) errorMsg = 'Limite de mensagens atingido. Aguarde um momento e tente novamente.';
            appendMessage(errorMsg, false);
            return;
        }
        
        const data = await res.json();
        
        if (data.conversation_id && !state.currentConversationId) {
            state.currentConversationId = data.conversation_id;
            loadConversations();
        }
        appendMessage(data.reply.trim(), false);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } finally { setLoading(false); }
});

// ========================================================
// 🎭 LOGICA DOS MODAIS (SALVAR/EXCLUIR)
// ========================================================

document.getElementById('rename-save')?.addEventListener('click', async () => {
    const newTitle = document.getElementById('rename-input').value.trim();
    if (!newTitle || !state.pendingActionId) return;
    const token = getAuthToken();
    const res = await fetch(`${API_V1_URL}/conversations/${state.pendingActionId}`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
    });
    if (res.ok) {
        closeAllModals();
        loadConversations();
    }
});

document.getElementById('confirm-ok')?.addEventListener('click', async () => {
    if (!state.pendingActionId) return;

    const token = getAuthToken();
    const res = await fetch(`${API_V1_URL}/conversations/${state.pendingActionId}`, { 
        method: 'DELETE',
        credentials: 'include'
    });

    if (res.ok) {
        if (state.currentConversationId === state.pendingActionId) {
            startNewChat();
        }

        closeAllModals();
        loadConversations();
    }
});

function closeAllModals() {
    document.getElementById('rename-modal').classList.add('hidden');
    document.getElementById('confirm-modal').classList.add('hidden');
    document.getElementById('rename-modal-overlay').classList.remove('active');
    document.getElementById('confirm-modal-overlay').classList.remove('active');
    state.pendingActionId = null;
}

document.getElementById('rename-cancel')?.addEventListener('click', closeAllModals);
document.getElementById('confirm-cancel')?.addEventListener('click', closeAllModals);
document.getElementById('new-conversation')?.addEventListener('click', startNewChat);

// ========================================================
// 🏁 INICIALIZAÇÃO
// ========================================================
document.addEventListener("DOMContentLoaded", async () => {
    if (!window.location.pathname.includes("estudante")) return;
    
    // Sempre atualizar dados do servidor para detectar mudanças de role
    const updatedUser = await loadUserDataFromServer();
    
    // Se o role mudou para teacher/admin, redirecionar
    if (updatedUser && (updatedUser.role === 'teacher' || updatedUser.role === 'admin')) {
        window.location.assign("/frontend/professor/index.html");
        return;
    }
    
    updateAvatarUI();
    loadConversations();
    
    // Check if there's a conversation ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('c');
    
    if (conversationId) {
        // Load the specific conversation
        loadConversationById(conversationId);
    } else {
        startNewChat();
    }
});
function appendMessage(content, isUser = false) {
    const wrapper = document.createElement("div");
    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;

    const bubble = document.createElement("div");
    bubble.className = `max-w-[85%] p-3 rounded-lg shadow-sm ${
        isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }`;

    bubble.textContent = content; // 🔐 seguro contra XSS
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}
