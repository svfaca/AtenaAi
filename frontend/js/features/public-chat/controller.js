import { API_BASE_URL } from "../../core/config.js";

let guestHistory = [];
let blockUntil = (() => {
  const stored = localStorage.getItem("guest_block_until");
  return stored ? parseInt(stored, 10) : null;
})();

function scrollToBottom(chat) {
  chat.scrollTop = chat.scrollHeight;
}

function showTyping(chat) {
  if (chat.querySelector("#ai-typing")) return;
  const typingDiv = document.createElement("div");
  typingDiv.id = "ai-typing";
  typingDiv.className = "flex justify-start mb-4";
  typingDiv.innerHTML = `
    <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex gap-1 items-center shadow-sm">
      <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
      <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    </div>`;
  chat.appendChild(typingDiv);
  scrollToBottom(chat);
}

function hideTyping(chat) {
  chat.querySelector("#ai-typing")?.remove();
}

function startBlockCountdown() {
  const interval = setInterval(() => {
    if (!blockUntil) return clearInterval(interval);
    const now = Math.floor(Date.now() / 1000);
    const remaining = blockUntil - now;
    if (remaining <= 0) {
      blockUntil = null;
      localStorage.removeItem("guest_block_until");
      document.getElementById("rate-limit-box")?.remove();
      clearInterval(interval);
      return;
    }
    const el = document.getElementById("rate-limit-timer");
    if (el) {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      el.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
}

function renderRateLimitBox(chat, retryAfterSeconds) {
  const now = Math.floor(Date.now() / 1000);
  blockUntil = now + retryAfterSeconds;
  localStorage.setItem("guest_block_until", blockUntil);

  chat.innerHTML += `
    <div id="rate-limit-box" class="flex justify-start mb-4">
      <div class="max-w-[85%] bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg shadow-sm">
        <strong>Limite de mensagens atingido.</strong><br>
        Aguarde <span id="rate-limit-timer"></span> para conversar novamente.<br><br>
        Ou crie uma conta gratuita:<br>
        <a href="cadastro" class="text-blue-600 dark:text-blue-400 underline font-semibold">Criar conta</a>
      </div>
    </div>`;

  startBlockCountdown();
  scrollToBottom(chat);
}

function setLoading(isLoading, input, sendBtn) {
  if (input) input.disabled = isLoading;
  if (sendBtn) sendBtn.disabled = isLoading;
  if (!isLoading && input) input.focus();
}

export function initPublicChat({
  chatSelector = "#chat-messages",
  formSelector = "#chat-form",
  inputSelector = "#user-input",
  sendBtnSelector = "#send-btn"
} = {}) {
  const chat = document.querySelector(chatSelector);
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const sendBtn = document.querySelector(sendBtnSelector);

  if (!chat || !form) {
    console.warn("Public chat missing elements", { chat: !!chat, form: !!form });
    return;
  }

  const observer = new MutationObserver(() => scrollToBottom(chat));
  observer.observe(chat, { childList: true, subtree: true });

  // Keyboard behavior: Enter sends, Ctrl+Enter inserts newline
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const value = input.value;
      input.value = `${value.substring(0, start)}\n${value.substring(end)}`;
      input.selectionStart = input.selectionEnd = start + 1;
    }
  });

  // Initial state: if already rate-limited, show box
  if (blockUntil) {
    const now = Math.floor(Date.now() / 1000);
    if (blockUntil > now) {
      renderRateLimitBox(chat, blockUntil - now);
    } else {
      blockUntil = null;
      localStorage.removeItem("guest_block_until");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (blockUntil) return;

    const text = input?.value?.trim();
    if (!text) return;

    // Render user bubble immediately
    const bubble = document.createElement("div");
    bubble.className = "flex justify-end mb-4";
    bubble.innerHTML = `<div class="max-w-[85%] bg-blue-600 text-white p-3 rounded-lg shadow-sm">${text}</div>`;
    chat.appendChild(bubble);

    guestHistory.push({ role: "user", content: text });
    if (input) {
      input.value = "";
      input.focus();
    }

    setLoading(true, input, sendBtn);
    showTyping(chat);
    scrollToBottom(chat);

    try {
      const language = typeof getLanguage === "function" ? getLanguage() : "pt-BR";
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, history: guestHistory, language })
      });

      if (res.status === 429) {
        const data = await res.json();
        renderRateLimitBox(chat, data.retry_after_seconds || 60);
        return;
      }

      const data = await res.json();
      if (data?.reply) {
        guestHistory.push({ role: "assistant", content: data.reply });
        const ai = document.createElement("div");
        ai.className = "flex justify-start mb-4";
        ai.innerHTML = `<div class="max-w-[85%] bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm">${data.reply.trim()}</div>`;
        chat.appendChild(ai);
      }
    } catch (error) {
      console.error("Public chat error", error);
      const err = document.createElement("div");
      err.className = "flex justify-start mb-4";
      err.innerHTML = `<div class="max-w-[85%] bg-red-100 text-red-600 p-3 rounded-lg shadow-sm">Erro ao conectar com servidor.</div>`;
      chat.appendChild(err);
    } finally {
      hideTyping(chat);
      setLoading(false, input, sendBtn);
      scrollToBottom(chat);
    }
  });

  scrollToBottom(chat);
}
