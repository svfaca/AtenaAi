import { renderStudentDashboardLayout } from '../layouts/student-dashboard-layout.js';
import { subscribe, logout } from '../store.js';

export function renderEstudante() {
  const app = document.getElementById('app');
  
  // Renderizar layout com conteúdo de chat
  const chatContent = `
    <div class="chat-container p-4 space-y-6 flex-1 bg-white dark:bg-gray-900 overflow-y-auto">
      <!-- Mensagens aparecem aqui -->
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">Bem-vindo ao chat!</p>
      </div>
    </div>

    <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 z-20">
      <form id="chat-form" class="flex items-end gap-3">
        <!-- Attachment Button -->
        <button type="button" id="btn-attach" class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0" title="Anexar arquivo">
          <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
          </svg>
        </button>
        <!-- Text Input -->
        <div class="flex-1 relative">
          <textarea id="user-input" rows="1" class="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all max-h-32" placeholder="Envie uma mensagem..." data-i18n-placeholder="chat.sendMessage" oninput="this.style.height = ''; this.style.height = Math.min(this.scrollHeight, 128) + 'px'"></textarea>
          <!-- Emoji Button Inside Input -->
          <button type="button" id="btn-emoji" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </button>
        </div>
        <!-- Send Button -->
        <button type="submit" id="send-btn" class="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg id="send-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          <svg id="loading-icon" class="w-5 h-5 animate-spin hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </button>
      </form>
      <div class="text-center text-[10px] text-gray-400 py-2 mt-1" data-i18n="footer.copyright">© 2026 AtenaAI</div>
    </div>

    <style>
      .chat-container { flex: 1; overflow-y: auto; overflow-x: hidden; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }
      .dark ::-webkit-scrollbar-thumb { background-color: #374151; }
      .dark ::-webkit-scrollbar-thumb:hover { background-color: #4B5563; }
    </style>
  `;

  app.innerHTML = renderStudentDashboardLayout(chatContent);

  // Setup sidebar toggle
  setupSidebarToggle();
  
  // Setup logout button
  setupLogoutButtons();
  
  // Setup theme toggle
  setupThemeToggle();

  // Cleanup function
  return () => {
    // Cleanup if needed
  };
}

function setupSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const mobileSidebarBtn = document.getElementById('mobile-sidebar-btn');
  const overlay = document.getElementById('sidebar-overlay');

  if (mobileSidebarBtn) {
    mobileSidebarBtn.addEventListener('click', () => {
      sidebar?.classList.add('mobile-open');
      overlay?.classList.add('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('mobile-open');
      overlay?.classList.remove('active');
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (window.innerWidth >= 768) {
        sidebar?.classList.toggle('sidebar-collapsed');
      } else {
        sidebar?.classList.remove('mobile-open');
        overlay?.classList.remove('active');
      }
    });
  }
}

function setupLogoutButtons() {
  const logoutBtn = document.getElementById('logout-btn');
  const collapsedLogout = document.getElementById('collapsed-logout');

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  logoutBtn?.addEventListener('click', handleLogout);
  collapsedLogout?.addEventListener('click', handleLogout);
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}