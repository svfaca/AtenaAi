import { initViewportHeight } from "./core/viewport.js";
import { router } from "./router.js";
import { getState } from "./store.js";

document.addEventListener("DOMContentLoaded", () => {
  initViewportHeight();
  
  console.log("[📱 APP] DOMContentLoaded - verificando guard.js status");
  console.log("[📱 APP] window.__guardStarted:", window.__guardStarted);
  
  let renderExecuted = false;
  
  const doRender = () => {
    if (renderExecuted) return;
    renderExecuted = true;
    
    const state = getState();
    console.log("[📱 APP] ✅ Renderizando com state:", { role: state.role, user: !!state.user });
    router();
  };
  
  // Opção 1: Aguardar o evento authHydrated (guard.js completou)
  window.addEventListener('authHydrated', () => {
    console.log("[📱 APP] ✅ authHydrated recebido");
    doRender();
  }, { once: true });
  
  // Opção 2: Se guard.js não disparar em 3s, renderizar mesmo assim
  setTimeout(() => {
    if (!renderExecuted) {
      console.warn("[📱 APP] ⚠️ Timeout esperando authHydrated (3s) - renderizando mesmo assim");
      doRender();
    }
  }, 3000);
});