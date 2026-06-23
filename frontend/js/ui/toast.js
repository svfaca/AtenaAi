/**
 * Sistema de notificações Toast - AtenaAI
 * Centralizado para máxima reutilização
 */

// Injetar estilos CSS apenas uma vez
(function injectToastStyles() {
  if (document.getElementById('atena-toast-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'atena-toast-styles';
  style.textContent = `
    .atena-toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 380px;
      pointer-events: none;
    }
    
    @media (max-width: 640px) {
      .atena-toast-container {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }
    }
    
    .atena-toast {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      border-left: 3px solid;
      animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }
    
    .dark .atena-toast {
      background: #1f2937;
      color: #f3f4f6;
    }
    
    /* Tipos de toast */
    .atena-toast.success { border-left-color: #10b981; }
    .atena-toast.error { border-left-color: #ef4444; }
    .atena-toast.warning { border-left-color: #f59e0b; }
    .atena-toast.info { border-left-color: #3b82f6; }
    
    .atena-toast-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .atena-toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .atena-toast-title {
      font-weight: 600;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    
    .atena-toast-message {
      font-size: 0.875rem;
      opacity: 0.85;
      line-height: 1.4;
    }
    
    .atena-toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.6;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    
    .atena-toast-close:hover {
      opacity: 1;
    }
    
    .atena-toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: currentColor;
      opacity: 0.3;
      animation: progressBar linear forwards;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes progressBar {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `;
  
  document.head.appendChild(style);
})();

// Ícones para cada tipo
const ICONS = {
  success: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
  error: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
  warning: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
  info: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
};

/**
 * Exibe um toast na tela
 */
export function showToast(options = {}) {
  const {
    type = 'info',
    title = '',
    message = '',
    duration = 5000,
    onClose = null
  } = options;

  // Garantir que message é string
  const messageStr = typeof message === 'string' ? message : String(message || '');

  // Criar container se não existir
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'atena-toast-container';
    document.body.appendChild(container);
  }

  // Criar elemento toast
  const toast = document.createElement('div');
  toast.className = `atena-toast ${type}`;

  const icon = ICONS[type] || ICONS.info;

  toast.innerHTML = `
    <div class="atena-toast-icon">${icon}</div>
    <div class="atena-toast-content">
      ${title ? `<div class="atena-toast-title">${title}</div>` : ''}
      <div class="atena-toast-message">${messageStr}</div>
    </div>
    <button class="atena-toast-close" type="button" aria-label="Fechar">
      <svg fill="currentColor" viewBox="0 0 20 20" style="width: 1.25rem; height: 1.25rem;">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
      </svg>
    </button>
    ${duration > 0 ? `<div class="atena-toast-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
  `;

  // Adicionar listeners
  const closeBtn = toast.querySelector('.atena-toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast, onClose));

  // Auto-remover após duration
  if (duration > 0) {
    setTimeout(() => removeToast(toast, onClose), duration);
  }

  // Adicionar ao container
  container.appendChild(toast);

  return toast;
}

/**
 * Remove um toast com animação
 */
function removeToast(toast, callback) {
  toast.style.animation = 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
  setTimeout(() => {
    toast.remove();
    if (callback) callback();
  }, 300);
}

/**
 * Helpers para tipos específicos
 */
export const toast = {
  success: (message, title = 'Sucesso', duration = 5000) =>
    showToast({ type: 'success', title, message, duration }),
  error: (message, title = 'Erro', duration = 5000) =>
    showToast({ type: 'error', title, message, duration }),
  warning: (message, title = 'Aviso', duration = 5000) =>
    showToast({ type: 'warning', title, message, duration }),
  info: (message, title = 'Informação', duration = 5000) =>
    showToast({ type: 'info', title, message, duration })
};

export default { showToast, toast };
