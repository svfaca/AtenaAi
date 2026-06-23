import { getState, subscribe } from "../store.js";

export function renderStudentDashboardLayout(content = "") {
  const state = getState();
  const user = state.user;
  const userName = user?.name || user?.full_name || user?.username || "Usuário";
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = user?.role || "student";

  return `
    <div class="flex flex-col relative w-full h-full">
        <!-- HEADER -->
        <header class="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900 z-10">
          <div class="flex items-center">
            <a href="#" class="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
              <img loading="lazy" src="/frontend/assets/logo/logo-icon-ligth.png" alt="AtenaAI" class="h-8 w-8 mr-2" data-theme-logo> AtenaAI
            </a>
            <span class="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">Estudante</span>
          </div>
          <div class="flex items-center gap-3">
            <button id="theme-toggle" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              <svg id="light-icon" class="w-5 h-5 hidden dark:block" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
              <svg id="dark-icon" class="w-5 h-5 block dark:hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            </button>
            <a href="#" data-i18n="navigation.about" class="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Quem Somos</a>
          </div>
        </header>

        <!-- CONTENT -->
        <div id="main-content" class="flex-1 flex flex-col overflow-hidden">
          ${content}
        </div>
    </div>
  `;
}
