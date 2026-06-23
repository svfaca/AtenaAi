import { Header } from "../components/layout/header.js";
import { renderChatContainer, renderChatInput } from "../features/public-chat/view.js";

function renderDefaultContent() {
  return `
    <main class="flex-1 flex flex-col relative w-full overflow-hidden">
      ${renderChatContainer()}
      ${renderChatInput()}
    </main>
  `;
}

export function renderPublicLayout(content) {
  const bodyContent = content ?? renderDefaultContent();

  return `
    <div class="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      ${Header()}
      ${bodyContent}
      <div id="modal-root"></div>
    </div>
  `;
}