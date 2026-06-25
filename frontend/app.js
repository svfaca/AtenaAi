import { initViewportHeight } from "./js/core/viewport.js";
import { router } from "./js/router.js";
import { getState } from "./js/store.js";
import { initThemeToggle } from "./js/core/theme.js";
import "./js/utils/i18n.js"; // Carregar i18n automaticamente

// Executar assim que possível (pode ser antes de DOMContentLoaded)
initViewportHeight();
initThemeToggle();

document.addEventListener("DOMContentLoaded", () => {
  console.log("[📱 APP] DOMContentLoaded");
  console.log("[📱 APP] window.__guardStarted:", window.__guardStarted);
  console.log("[📱 APP] window.__authHydrated:", window.__authHydrated);
  
  // Carregar guard.js para validação completa após DOMContentLoaded
  import("./js/middleware/guard.js").catch(err => {
    console.error("[📱 APP] ⚠️ Erro ao carregar guard.js:", err);
  });
  
  let renderExecuted = false;
  
  const doRender = () => {
    if (renderExecuted) return;
    renderExecuted = true;
    
    const state = getState();
    console.log("[📱 APP] ✅ Renderizando com state:", { role: state.role, user: !!state.user });
    router();
  };
  
  // Se authHydrated foi disparado, renderizar imediatamente
  if (window.__authHydrated) {
    console.log("[📱 APP] ✅ authHydrated já foi disparado, renderizando...");
    doRender();
  }
  
  // Aguardar o evento authHydrated (pode já ter sido disparado)
  window.addEventListener('authHydrated', () => {
    console.log("[📱 APP] ✅ authHydrated evento recebido");
    window.__authHydrated = true;
    doRender();
  }, { once: true });
  
  // Timeout de segurança para forçar renderização
  setTimeout(() => {
    if (!renderExecuted) {
      console.warn("[📱 APP] ⚠️ Timeout esperando authHydrated (4s)");
      doRender();
    }
  }, 4000);
});
