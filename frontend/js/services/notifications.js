/**
 * Serviço de Notificações - AtenaAI
 * [DEPRECATED] Use notificationService do lib.js
 * 
 * Este arquivo foi consolidado em:
 * - services/notification-service.js
 * - ui/toast.js
 * 
 * Para migrar, use:
 * import { notificationService, toast } from './lib.js';
 */

import { notificationService } from './notification-service.js';

// Re-exportar para compatibilidade retroativa
export { notificationService };
export const startNotificationService = () => notificationService.start();
export const stopNotificationService = () => notificationService.stop();
export const initNotifications = () => notificationService.start();
export const stopNotifications = () => notificationService.stop();

