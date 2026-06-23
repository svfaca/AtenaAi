/**
 * AtenaAI Frontend - Índice Central de Módulos
 * Exporta todos os serviços, utilitários e componentes principais
 */

// ============================================================
// 🔐 NÚCLEO (core)
// ============================================================
import { apiClient, apiRequest } from './core/api-client.js';
import { API_BASE_URL, API_V1_URL } from './core/config.js';
import {
  AppError, AuthError, ValidationError, NetworkError,
  extractErrorMessage, Logger
} from './core/error-handler.js';
import { getState, setState, hydrateAuth, logout } from './store.js';

export { apiClient, apiRequest } from './core/api-client.js';
export { API_BASE_URL, API_V1_URL } from './core/config.js';
export { AppError, AuthError, ValidationError, NetworkError, extractErrorMessage, Logger } from './core/error-handler.js';
export { getState, setState, hydrateAuth, logout } from './store.js';

// ============================================================
// 💼 SERVIÇOS (services)
// ============================================================
import { chatService, ChatService } from './services/chat-service.js';
import { classroomService, ClassroomService } from './services/classroom-service.js';
import { notificationService } from './services/notification-service.js';

export { chatService, ChatService } from './services/chat-service.js';
export { classroomService, ClassroomService } from './services/classroom-service.js';
export { notificationService } from './services/notification-service.js';

// ============================================================
// 🎨 UI COMPONENTS
// ============================================================
import { showToast, toast } from './ui/toast.js';
import { themeManager, ThemeManager } from './ui/theme.js';

export { showToast, toast } from './ui/toast.js';
export { themeManager, ThemeManager } from './ui/theme.js';

// ============================================================
// 🛠️ UTILITÁRIOS (utils)
// ============================================================
// Será expandido conforme necessário

export default {
  // API
  apiClient, apiRequest, API_BASE_URL, API_V1_URL,

  // Error Handling
  AppError, AuthError, ValidationError, NetworkError, extractErrorMessage, Logger,

  // Store
  getState, setState, hydrateAuth, logout,

  // Services
  chatService, classroomService, notificationService,

  // UI
  showToast, toast, themeManager,
};