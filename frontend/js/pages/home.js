import { renderPublicLayout } from "../layouts/public-layout.js";
import { initPublicChat } from "../features/public-chat/controller.js";
import { initThemeToggle } from "../core/theme.js";
import { initHeader } from "../components/layout/header-controller.js";
import { initModalSystem } from "../components/modal-controller.js";

export function renderHome() {
  document.getElementById("app").innerHTML = renderPublicLayout();
  initThemeToggle();
  const headerCleanup = initHeader();
  initPublicChat();
  initModalSystem();

  return headerCleanup;
}