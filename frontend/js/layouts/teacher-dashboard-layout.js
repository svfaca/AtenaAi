import { getState, subscribe } from "../store.js";

export function renderTeacherDashboardLayout(content = "") {
  const state = getState();
  const user = state.user;
  const userName = user?.name || user?.full_name || user?.username || "Usuário";
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = user?.role || "teacher";
  const roleLabel = userRole === "admin" ? "Admin" : "Professor";

  return `
    <div id="sidebar-overlay"></div>

    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- SIDEBAR -->
      <aside id="sidebar" class="sidebar-collapsed flex flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between h-16 shrink-0">
          <div id="user-avatar" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold select-none relative cursor-pointer hover:opacity-90 transition-opacity">
            <img loading="lazy" id="avatar-image" class="w-full h-full object-cover hidden rounded-full" src="" alt="Avatar">
            <span id="avatar-initial">${userInitial}</span>
          </div>
          <div class="sidebar-expanded-content flex-1 ml-3 overflow-hidden">
            <p id="user-name" class="font-semibold text-sm truncate">${userName}</p>
            <p id="user-role" class="text-xs text-gray-500 truncate">${roleLabel}</p>
          </div>
          <button id="sidebar-toggle" class="sidebar-expanded-content p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div class="sidebar-expanded-content p-3 space-y-3">
            <!-- Turmas Section -->
            <div class="flex items-center justify-between px-1">
              <p class="text-xs uppercase text-gray-500 font-bold tracking-wider">Turmas</p>
              <button id="add-classroom-btn" class="text-xs text-green-600 font-medium hover:text-green-700 transition-colors flex items-center gap-1" title="Criar uma turma">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>Criar</span>
              </button>
            </div>
            <div class="relative mt-2">
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/></svg>
              <input id="classroom-search" type="search" autocomplete="off" class="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all" placeholder="Buscar turmas">
            </div>
            <ul id="classroom-list" class="space-y-1 pb-2" style="transition: opacity 0.2s ease;"></ul>

            <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            <!-- Atividades Section -->
            <div class="flex items-center justify-between px-1">
              <p class="text-xs uppercase text-gray-500 font-bold tracking-wider">Atividades</p>
              <button id="new-activity" class="text-xs text-green-600 font-medium hover:text-green-700 transition-colors flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>Nova</span>
              </button>
            </div>
            <div class="relative mt-2">
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/></svg>
              <input id="activity-search" type="search" autocomplete="off" class="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all" placeholder="Buscar atividades">
            </div>
            <ul id="activity-list" class="space-y-1 pb-4" style="transition: opacity 0.2s ease;"></ul>
          </div>
          <div class="sidebar-collapsed-content pt-4 w-full flex flex-col items-center gap-3">
            <button onclick="document.getElementById('add-classroom-btn').click()" class="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Criar turma">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </button>
            <button onclick="document.getElementById('new-activity').click()" class="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Nova Atividade">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 p-2 shrink-0">
          <div class="sidebar-expanded-content space-y-1 px-1">
            <a href="#" class="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 py-2 px-2 rounded flex items-center gap-2 transition-colors">Quem Somos</a>
            <button id="settings-btn" class="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 py-2 px-2 rounded flex items-center gap-2 transition-colors">Configurações</button>
            <button id="logout-btn" class="w-full text-left text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 px-2 rounded flex items-center gap-2 transition-colors">Sair</button>
          </div>
          <div class="sidebar-collapsed-content flex flex-col items-center gap-2 py-2">
            <button id="collapsed-settings" class="icon-btn-collapsed text-gray-500" title="Configurações"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
            <button id="collapsed-logout" class="icon-btn-collapsed logout text-gray-500" title="Sair"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg></button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <div class="flex-1 flex flex-col relative w-full h-full">
        <!-- HEADER -->
        <header class="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900 z-10">
          <div class="flex items-center">
            <button id="mobile-sidebar-btn" class="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 mr-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <a href="#" class="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
              <img loading="lazy" src="/frontend/assets/logo/logo-icon-ligth.png" alt="AtenaAI" class="h-8 w-8 mr-2" data-theme-logo> AtenaAI
            </a>
            <span class="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">${roleLabel}</span>
          </div>
          <div class="flex items-center gap-3">
            <button id="theme-toggle" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              <svg id="light-icon" class="w-5 h-5 hidden dark:block" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
              <svg id="dark-icon" class="w-5 h-5 block dark:hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            </button>
            <a href="#" class="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Quem Somos</a>
          </div>
        </header>

        <!-- CONTENT -->
        <div id="main-content" class="flex-1 flex flex-col overflow-hidden">
          ${content}
        </div>
      </div>
    </div>

    <!-- STYLES -->
    <style>
      #sidebar { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); width: 16rem; display: flex; flex-direction: column; background-color: #F9FAFB; border-right: 1px solid #E5E7EB; z-index: 40; }
      .dark #sidebar { background-color: #1F2937; border-color: #374151; }
      #sidebar.sidebar-collapsed { width: 4.5rem !important; }
      #sidebar.sidebar-collapsed .sidebar-expanded-content { display: none !important; }
      #sidebar.sidebar-collapsed .sidebar-collapsed-content { display: flex !important; flex-direction: column; align-items: center; width: 100%; }
      #sidebar:not(.sidebar-collapsed) .sidebar-collapsed-content { display: none !important; }

      @media (max-width: 767px) {
        #sidebar { position: fixed; left: 0; top: 0; height: 100%; z-index: 50; transform: translateX(-100%); width: 16rem !important; }
        #sidebar.mobile-open { transform: translateX(0); }
        #sidebar.sidebar-collapsed { width: 16rem !important; }
        #sidebar.sidebar-collapsed .sidebar-expanded-content { display: block !important; }
        #sidebar.sidebar-collapsed .sidebar-collapsed-content { display: none !important; }
        #sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 45; }
        #sidebar-overlay.active { display: block; }
        #sidebar-toggle { display: none !important; }
      }

      .icon-btn-collapsed { padding: 0.5rem; border-radius: 0.75rem; }
      .icon-btn-collapsed:hover { background-color: #e5e7eb; }
      .dark .icon-btn-collapsed:hover { background-color: #374151; }
    </style>
  `;
}
