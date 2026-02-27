import { API_BASE_URL } from "../core/config.js";

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatMessages = document.getElementById("chat-messages");
const sendBtn = document.getElementById("send-btn");

// ======================================================
// 🧠 Memória temporária do visitante
let guestHistory = [];

// ======================================================
// ⏳ Controle de bloqueio sincronizado com backend
let blockUntil = localStorage.getItem("guest_block_until");
blockUntil = blockUntil ? parseInt(blockUntil) : null;

// ======================================================
// 🌍 Boas-vindas
function renderWelcomeMessage() {
    let welcomeText = null;

    if (typeof t === "function") {
        try { welcomeText = t("messages.welcome"); } catch (e) {}
    }

    if (!welcomeText || welcomeText === "messages.welcome") {
        const lang = (typeof getLanguage === "function") ? getLanguage() : "pt-BR";
        welcomeText = lang.startsWith("en")
            ? "Hello! I am AtenaAI.\n\nHow can I help you with your studies today?"
            : "Olá! Eu sou a AtenaAI.\n\nComo posso ajudar nos seus estudos hoje?";
    }

    const parts = welcomeText.split("\n\n");
    const first = parts.shift() || "";
    const rest = parts.join("\n\n");

    return `
    <div class="flex justify-start mb-4 welcome-msg">
      <div class="max-w-[85%] bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm border border-blue-100 dark:border-blue-900/30">
        <p class="font-semibold mb-1"><strong>${first}</strong></p>
        <p class="text-sm">${rest}</p>
      </div>
    </div>`;
}

// ======================================================
// ⏳ Contador
function startBlockCountdown() {
    const interval = setInterval(() => {
        if (!blockUntil) return clearInterval(interval);

        const now = Math.floor(Date.now() / 1000);
        let remaining = blockUntil - now;

        if (remaining <= 0) {
            blockUntil = null;
            localStorage.removeItem("guest_block_until");
            document.getElementById("rate-limit-box")?.remove();
            clearInterval(interval);
            return;
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        const el = document.getElementById("rate-limit-timer");
        if (el) {
            el.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
    }, 1000);
}

// ======================================================
// 🚫 Caixa de bloqueio
function renderRateLimitBox(retryAfterSeconds) {
    const now = Math.floor(Date.now() / 1000);
    blockUntil = now + retryAfterSeconds;

    localStorage.setItem("guest_block_until", blockUntil);

    const title = (typeof t === "function")
        ? t("messages.rateLimitTitle")
        : "Limite de mensagens atingido.";

    const waitText = (typeof t === "function")
        ? t("messages.rateLimitWait")
        : "Aguarde {time} para conversar novamente.";

    const orText = (typeof t === "function")
        ? t("messages.rateLimitOr")
        : "Ou crie uma conta gratuita:";

    const btnText = (typeof t === "function")
        ? t("messages.rateLimitCreate")
        : "Criar conta";

    chatMessages.innerHTML += `
    <div id="rate-limit-box" class="flex justify-start mb-4">
      <div class="max-w-[85%] bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg shadow-sm">
        <strong>${title}</strong><br>
        ${waitText.replace("{time}", `<span id="rate-limit-timer"></span>`)}<br><br>
        ${orText}<br>
        <a href="cadastro" class="text-blue-600 dark:text-blue-400 underline font-semibold">
            ${btnText}
        </a>
      </div>
    </div>`;

    startBlockCountdown();
}

// ======================================================
// 🚀 Inicialização
if (form && input && chatMessages) {

    chatMessages.innerHTML = renderWelcomeMessage();

    document.addEventListener("i18n:loaded", () => {
        chatMessages.querySelectorAll(".welcome-msg").forEach(el => {
            el.outerHTML = renderWelcomeMessage();
        });
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
            // Enter sem modificadores: enviar mensagem
            e.preventDefault();
            if (!input.disabled) form.requestSubmit();
        } else if (e.key === "Enter" && e.ctrlKey) {
            // Ctrl+Enter: inserir quebra de linha
            e.preventDefault();
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;
            input.value = value.substring(0, start) + "\n" + value.substring(end);
            input.selectionStart = input.selectionEnd = start + 1;
            // Trigger resize
            input.dispatchEvent(new Event("input"));
        }
    });

    // Se já estiver bloqueado ao abrir página
    if (blockUntil) {
        const now = Math.floor(Date.now() / 1000);
        if (blockUntil > now) {
            renderRateLimitBox(blockUntil - now);
        } else {
            blockUntil = null;
            localStorage.removeItem("guest_block_until");
        }
    }

    function setLoading(isLoading) {
        input.disabled = isLoading;
        if (sendBtn) sendBtn.disabled = isLoading;

        if (isLoading) {
            const typingDiv = document.createElement("div");
            typingDiv.id = "ai-typing";
            typingDiv.className = "flex justify-start mb-4";
            typingDiv.innerHTML = `
              <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex gap-1 items-center shadow-sm">
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              </div>`;
            chatMessages.appendChild(typingDiv);
        } else {
            document.getElementById("ai-typing")?.remove();
            input.focus();
        }
    }

    // ======================================================
    // 💬 Envio público
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (blockUntil) return;

        const text = input.value.trim();
        if (!text || input.disabled) return;

        chatMessages.innerHTML += `
        <div class="flex justify-end mb-4">
          <div class="max-w-[85%] bg-blue-600 text-white p-3 rounded-lg shadow-sm">
            ${text}
          </div>
        </div>`;

        guestHistory.push({ role: "user", content: text });

        input.value = "";
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    history: guestHistory,
                    language: (typeof getLanguage === "function" ? getLanguage() : "pt-BR")
                })
            });

            if (res.status === 429) {
                const data = await res.json();
                renderRateLimitBox(data.retry_after_seconds);
                return;
            }

            const data = await res.json();
            guestHistory.push({ role: "assistant", content: data.reply });

            chatMessages.innerHTML += `
            <div class="flex justify-start mb-4">
              <div class="max-w-[85%] bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm">
                ${data.reply.trim()}
              </div>
            </div>`;

        } catch {
            chatMessages.innerHTML += `
            <div class="flex justify-start mb-4">
              <div class="max-w-[85%] bg-red-100 text-red-600 p-3 rounded-lg shadow-sm">
                Erro ao conectar com servidor.
              </div>
            </div>`;
        } finally {
            setLoading(false);
        }
    });
    function scrollToBottom() {
  const chat = document.getElementById("chat-messages");
  chat.scrollTop = chat.scrollHeight;
}

// Sempre que adicionar mensagem:
scrollToBottom();

}
