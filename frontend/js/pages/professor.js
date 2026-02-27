import { renderTeacherDashboardLayout } from '../layouts/teacher-dashboard-layout.js';
import { logout } from '../store.js';

export function renderProfessor() {
  const app = document.getElementById('app');
  
  // Renderizar layout com conteúdo de dashboard do professor
  const content = `
    <div class="p-6 flex-1 bg-white dark:bg-gray-900 overflow-y-auto">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Painel do Professor</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Gerencie suas turmas e atividades</p>
        
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Turmas Ativas</p>
            <p class="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Alunos</p>
            <p class="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Atividades Pendentes</p>
            <p class="text-3xl font-bold text-orange-600 mt-2">0</p>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividades Recentes</h2>
          <p class="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma atividade recente</p>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = renderTeacherDashboardLayout(content);

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
