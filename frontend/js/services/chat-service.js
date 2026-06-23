/**
 * Serviço de Chat - AtenaAI
 * Gerencia conversas 1:1 com a IA
 */

import { apiClient } from "../core/api-client.js";
import { toast } from "../ui/toast.js";
import { Logger } from "../core/error-handler.js";

export class ChatService {
  constructor() {
    this.currentConversationId = null;
    this.conversations = [];
  }

  /**
   * Carrega lista de conversas do usuário
   */
  async loadConversations() {
    try {
      const data = await apiClient.get('/conversations');
      this.conversations = Array.isArray(data) ? data : (data?.items || []);
      return this.conversations;
    } catch (error) {
      Logger.error('ChatService', error);
      toast.error(error.message, 'Erro ao carregar conversas');
      throw error;
    }
  }

  /**
   * Cria nova conversa
   */
  async createConversation() {
    try {
      const data = await apiClient.post('/conversations', {});
      this.currentConversationId = data.id;
      this.conversations.push(data);
      return data;
    } catch (error) {
      Logger.error('ChatService', error);
      toast.error(error.message, 'Erro ao criar conversa');
      throw error;
    }
  }

  /**
   * Obtém mensagens de uma conversa
   */
  async getMessages(conversationId, limit = 50) {
    try {
      const data = await apiClient.get(`/conversations/${conversationId}/messages?limit=${limit}`);
      return data?.messages || [];
    } catch (error) {
      Logger.error('ChatService', error);
      throw error;
    }
  }

  /**
   * Envia mensagem para a IA
   */
  async sendMessage(conversationId, message) {
    try {
      const data = await apiClient.post(
        `/conversations/${conversationId}/messages`,
        { message }
      );
      return data;
    } catch (error) {
      Logger.error('ChatService', error);
      toast.error(error.message, 'Erro ao enviar mensagem');
      throw error;
    }
  }

  /**
   * Deleta conversa
   */
  async deleteConversation(conversationId) {
    try {
      await apiClient.delete(`/conversations/${conversationId}`);
      this.conversations = this.conversations.filter(c => c.id !== conversationId);
      return true;
    } catch (error) {
      Logger.error('ChatService', error);
      toast.error(error.message, 'Erro ao deletar conversa');
      throw error;
    }
  }

  /**
   * Renomeia conversa
   */
  async renameConversation(conversationId, title) {
    try {
      const data = await apiClient.put(
        `/conversations/${conversationId}`,
        { title }
      );
      const index = this.conversations.findIndex(c => c.id === conversationId);
      if (index !== -1) this.conversations[index] = data;
      return data;
    } catch (error) {
      Logger.error('ChatService', error);
      toast.error(error.message, 'Erro ao renomear conversa');
      throw error;
    }
  }
}

export const chatService = new ChatService();
export default chatService;
