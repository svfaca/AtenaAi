export function renderChatContainer() {
  return `
    <div id="chat-messages" class="chat-container p-4 space-y-6 flex-1 overflow-y-auto">
      <div class="flex items-start">
        <div class="message bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <p class="m-0" data-i18n="messages.welcome"><strong>Olá! Eu sou a AtenaAI.</strong><br><br>Como posso ajudar nos seus estudos hoje?</p>
        </div>
      </div>
    </div>
  `;
}

export function renderChatInput() {
  return `
    <div class="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-20 py-2 px-4">
      <form id="chat-form" class="flex gap-2 relative items-end">
        <textarea
          id="user-input"
          rows="1"
          class="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl p-2.5 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm max-h-32 text-sm sm:text-base"
          placeholder="Envie uma mensagem..."
          data-i18n-placeholder="chat.sendMessage"
        ></textarea>
        <button type="submit" id="send-btn" class="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <svg id="send-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2z" />
          </svg>
          <svg id="loading-icon" class="w-5 h-5 animate-spin hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </form>
      <div class="text-center text-[10px] text-gray-400 mt-1" data-i18n="footer.copyright">© 2026 AtenaAI — Projeto educacional e experimental.</div>
    </div>
  `;
}
