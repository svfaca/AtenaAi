import { getState, subscribe, closeModal } from "../store.js";
import { renderLoginModal } from "../features/auth/login-modal.js";
import { renderRegisterModal } from "../features/auth/register-modal.js";

let unsubscribe = null;

export function initModalSystem() {
  // Cleanup listener antigo se existir
  if (unsubscribe) {
    unsubscribe();
  }

  // Subscribe retorna função de unsubscribe
  unsubscribe = subscribe(renderModal);
  
  // Renderiza estado inicial
  renderModal(getState());

  // Setup ESC key
  setupEscapeKey();
}

function renderModal(state) {
  const root = document.getElementById("modal-root");
  if (!root) return;

  if (!state.modal) {
    root.innerHTML = "";
    // Cleanup event listeners quando modal fecha
    document.removeEventListener("keydown", handleEscapeKey);
    return;
  }

  if (state.modal === "login") {
    root.innerHTML = renderLoginModal();
    setupEscapeKey();
  }

  if (state.modal === "register") {
    root.innerHTML = renderRegisterModal();
    setupEscapeKey();
  }
}

function setupEscapeKey() {
  // Remove listener anterior para evitar duplicação
  document.removeEventListener("keydown", handleEscapeKey);
  // Adiciona novo listener
  document.addEventListener("keydown", handleEscapeKey);
}

function handleEscapeKey(e) {
  if (e.key === "Escape") {
    const state = getState();
    if (state.modal) {
      e.preventDefault();
      closeModal();
    }
  }
}
