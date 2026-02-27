export function Header() {
  return `
    <header class="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900 z-10">
      <div class="flex items-center gap-3">
        <a href="/" data-link class="flex items-center text-xl font-bold">
          <img src="assets/logo/logo-icon-ligth.png" alt="AtenaAI" class="h-8 w-8 mr-2" data-theme-logo>
          AtenaAI
        </a>
        <span
          id="header-badge"
          class="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hidden"
          aria-live="polite"
        ></span>
      </div>
      <div class="flex items-center gap-2">
        <button id="theme-toggle" class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" aria-label="Toggle theme">
          <svg id="light-icon" class="w-5 h-5 hidden dark:block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
          <svg id="dark-icon" class="w-5 h-5 block dark:hidden" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
        </button>
        <div class="hidden md:flex items-center gap-2">
          <a href="quem-somos" data-link data-i18n="navigation.about" class="text-sm font-medium hover:underline px-2">Quem somos</a>
          <div id="menu-not-logged" class="flex items-center gap-2">
            <button id="login-btn" data-i18n="navigation.login" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">Entrar</button>
            <button id="register-btn" data-i18n="navigation.register" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">Criar Conta</button>
          </div>
          <div id="menu-logged" class="hidden items-center gap-2">
            <a href="estudante" data-link data-i18n="navigation.chat" class="text-sm font-medium hover:underline px-2">Chat</a>
            <a href="professor" data-link data-i18n="navigation.professor" class="text-sm font-medium hover:underline px-2">Professor</a>
            <button id="logout-btn" data-i18n="navigation.logout" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">Sair</button>
          </div>
        </div>
        <button id="mobile-menu-btn" class="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" aria-label="Abrir menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </header>
    <div id="mobile-menu" class="hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 p-4 shadow-lg md:hidden">
      <div class="flex flex-col gap-3">
        <a href="quem-somos" data-link data-i18n="navigation.about" class="text-sm font medium py-2 border-b border-gray-100 dark:border-gray-800">Quem somos</a>
        <div id="mobile-menu-not-logged" class="flex flex-col gap-2">
          <button id="mobile-login-btn" data-i18n="navigation.login" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center">Entrar</button>
          <button id="mobile-register-btn" data-i18n="navigation.register" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium text-center">Criar Conta</button>
        </div>
        <div id="mobile-menu-logged" class="hidden flex flex-col gap-2">
          <a href="estudante" data-link data-i18n="navigation.chat" class="text-sm font-medium py-2 border-b border-gray-100 dark:border-gray-800">Chat</a>
          <a href="professor" data-link data-i18n="navigation.professor" class="text-sm font-medium py-2 border-b border-gray-100 dark:border-gray-800">Professor</a>
          <button id="mobile-logout-btn" data-i18n="navigation.logout" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center">Sair</button>
        </div>
      </div>
    </div>
  `;
}
