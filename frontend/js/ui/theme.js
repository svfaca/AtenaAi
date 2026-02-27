/**
 * Gerenciador de Tema - AtenaAI
 * Theme switching e persistência entre sessões
 */

export class ThemeManager {
  constructor() {
    this.THEME_KEY = 'atena_theme';
    this.DARK_CLASS = 'dark';
    this.init();
  }

  /**
   * Inicializa o tema
   */
  init() {
    const savedTheme = this.getTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    this.setTheme(isDark ? 'dark' : 'light');
  }

  /**
   * Obtém tema atual
   */
  getTheme() {
    return localStorage.getItem(this.THEME_KEY) || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  /**
   * Define tema
   */
  setTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add(this.DARK_CLASS);
    } else {
      document.documentElement.classList.remove(this.DARK_CLASS);
    }

    this.updateThemeAssets();
    this.dispatchChangeEvent();
  }

  /**
   * Alterna tema
   */
  toggle() {
    const newTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Atualiza assets que dependem do tema
   */
  updateThemeAssets() {
    const isDark = this.getTheme() === 'dark';
    const fileName = isDark ? 'logo-icon-dark.png' : 'logo-icon-ligth.png';
    
    document.querySelectorAll('[data-theme-logo]').forEach(img => {
      const basePath = img.src.substring(0, img.src.lastIndexOf('/') + 1);
      img.src = basePath + fileName;
    });
  }

  /**
   * Dispara evento de mudança de tema
   */
  dispatchChangeEvent() {
    document.dispatchEvent(new CustomEvent('theme:changed', {
      detail: { theme: this.getTheme() }
    }));
  }

  /**
   * Listener para mudanças no sistema
   */
  setupSystemListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Para navegadores modernos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(this.THEME_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    } else if (mediaQuery.addListener) {
      // Para navegadores antigos
      mediaQuery.addListener((e) => {
        if (!localStorage.getItem(this.THEME_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
}

export const themeManager = new ThemeManager();
export default themeManager;
