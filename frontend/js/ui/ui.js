// ===== HELPER: LOGO =====
function updateAllLogos() {
  const isDark = document.documentElement.classList.contains("dark");
  document.querySelectorAll('[data-theme-logo]').forEach(img => {
    // Pega o src original para determinar o caminho base
    let originalSrc = img.src;
    let basePath = originalSrc.substring(0, originalSrc.lastIndexOf('/') + 1);
    let fileName = isDark ? "logo-icon-dark-20260627.png" : "logo-icon-ligth-20260627.png";
    img.src = basePath + fileName;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try { window.updateAllLogos = updateAllLogos; } catch (e) {}

  // 1. TEMA
  if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  updateAllLogos();

  document.getElementById("theme-toggle")?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
    updateAllLogos();
  });

  // ============================================================
  // 2. LÓGICA DA SIDEBAR (CORRIGIDA PARA MOBILE)
  // ============================================================
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle"); // Botão dentro da sidebar
  const mobileSidebarBtn = document.getElementById("mobile-sidebar-btn"); // Botão no header mobile
  const overlay = document.getElementById("sidebar-overlay");
  const userAvatar = document.getElementById("user-avatar");

  // ABRIR SIDEBAR (Mobile Header)
  mobileSidebarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar?.classList.add("mobile-open");
    overlay?.classList.add("active");
  });

  // FECHAR SIDEBAR (Overlay)
  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("mobile-open");
    overlay?.classList.remove("active");
  });

  // BOTÃO INTERNO DA SIDEBAR (HAMBURGUER/TOGGLE)
  // Correção: Agora ele fecha a sidebar se estiver no mobile
  sidebarToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    
    if (window.innerWidth < 768) {
      // MOBILE: Funciona como botão "Fechar"
      sidebar.classList.remove("mobile-open");
      overlay?.classList.remove("active");
    } else {
      // DESKTOP: Funciona como botão "Colapsar/Expandir"
      sidebar.classList.toggle("sidebar-collapsed");
      // Salvar estado da sidebar
      const isCollapsed = sidebar.classList.contains("sidebar-collapsed");
      localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    }
  });

  // AVATAR: Abre a sidebar se estiver fechada (Desktop)
  userAvatar?.addEventListener("click", (e) => {
      if (window.innerWidth >= 768 && sidebar && sidebar.classList.contains("sidebar-collapsed")) {
          e.stopPropagation();
          sidebar.classList.remove("sidebar-collapsed");
          // Salvar estado da sidebar
          localStorage.setItem('sidebarCollapsed', 'false');
      }
  });

  // Restaurar estado da sidebar ao carregar (Desktop)
  if (window.innerWidth >= 768 && sidebar) {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      sidebar.classList.add('sidebar-collapsed');
    } else if (savedState === 'false') {
      sidebar.classList.remove('sidebar-collapsed');
    } else {
      // Se não houver estado salvo, mantém comportamento padrão (collapsed)
      sidebar.classList.add('sidebar-collapsed');
    }
  }

  // ============================================================
  // 3. SETTINGS MODAL (CORRIGIDO)
  // ============================================================
  const settingsBtn = document.getElementById("settings-btn"); // Botão Texto (Aberto)
  const collapsedSettings = document.getElementById("collapsed-settings"); // Botão Ícone (Fechado)
  
  const modal = document.getElementById("settings-modal");
  const modalOverlay = document.getElementById("settings-modal-overlay");
  const closeBtn = document.getElementById("close-settings");
  const cancelBtn = document.getElementById("cancel-settings"); // Botão cancelar dentro do form

  const openSettings = () => {
      if(modal) {
          modal.classList.remove("hidden"); // Remove hidden se tiver
          // Pequeno delay para permitir transição CSS
          setTimeout(() => modal.classList.add("active"), 10);
      }
      if(modalOverlay) {
          modalOverlay.classList.remove("hidden");
          setTimeout(() => modalOverlay.classList.add("active"), 10);
      }
  };

  const closeSettingsModal = () => {
      if(modal) modal.classList.remove("active");
      if(modalOverlay) modalOverlay.classList.remove("active");
      
      // Espera a animação (0.3s) antes de esconder totalmente
      setTimeout(() => {
          // Só adiciona hidden se não tiver a classe active (para evitar bugs de clique rápido)
          if(modal && !modal.classList.contains("active")) modal.classList.add("hidden");
          if(modalOverlay && !modalOverlay.classList.contains("active")) modalOverlay.classList.add("hidden");
      }, 300);
  };

  // Listeners de Abrir
  settingsBtn?.addEventListener("click", (e) => { e.preventDefault(); openSettings(); });
  collapsedSettings?.addEventListener("click", (e) => { e.preventDefault(); openSettings(); });
  
  // Listeners de Fechar
  closeBtn?.addEventListener("click", (e) => { e.preventDefault(); closeSettingsModal(); });
  cancelBtn?.addEventListener("click", (e) => { e.preventDefault(); closeSettingsModal(); });
  modalOverlay?.addEventListener("click", closeSettingsModal);


  // 4. MENU HAMBURGUER SUPERIOR (PÚBLICO/INDEX)
  // Mantive sua lógica segura aqui
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    const toggleMobileMenu = (e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        mobileMenu.classList.toggle('hidden');
    };
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', (e) => {
        if (!mobileMenu.classList.contains('hidden')) {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
  }

  // 5. TOAST GLOBAL
  window.showToast = function (messageOrObj, type = "info") {
    // Support both: showToast('msg', 'type') and showToast({ title, message, type })
    let title, message;
    
    if (typeof messageOrObj === 'object') {
      title = messageOrObj.title;
      message = messageOrObj.message || messageOrObj.title || '';
      type = messageOrObj.type || type;
    } else {
      message = messageOrObj;
      title = null;
    }

    const t = document.getElementById("toast");
    if (!t) {
      // Fallback to toast-container (professor page style)
      const container = document.getElementById("toast-container");
      if (container && message) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        const icons = {
          success: `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
          error: `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
          info: `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        };
        toastEl.innerHTML = `<div class="flex items-center">${icons[type] || icons.info}<span>${message}</span></div>`;
        container.appendChild(toastEl);
        setTimeout(() => {
          toastEl.style.animation = 'fadeOut 0.3s ease forwards';
          setTimeout(() => toastEl.remove(), 300);
        }, 3000);
        return;
      }
      // Last resort - do nothing instead of alert(undefined)
      if (message)
      return;
    }
    
    const titleEl = document.getElementById("toast-title");
    const msgEl = document.getElementById("toast-message");
    const icon = document.getElementById("toast-icon");

    // Tradução (se disponível)
    try {
      if (typeof window.t === 'function') {
        title = title ? window.t(title) : window.t('toasts.defaultTitle');
        message = message ? window.t(message) : window.t('toasts.defaultMessage');
      }
    } catch (e) { /* silenciar */ }

    if(titleEl) titleEl.textContent = title || '';
    if(msgEl) msgEl.textContent = message;

    if(icon) icon.innerHTML = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 3000);
  };
});