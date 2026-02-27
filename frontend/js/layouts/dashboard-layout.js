import { getState } from "../store.js";

export function renderDashboardLayout(content) {
  const { role } = getState();

  const sidebar = role === "professor"
    ? `<aside class="w-60 border-r p-4">Sidebar Professor</aside>`
    : `<aside class="w-60 border-r p-4">Sidebar Estudante</aside>`;

  return `
    <div class="min-h-screen flex">
      ${sidebar}
      <div class="flex-1 flex flex-col">
        <header class="h-16 border-b flex items-center px-6">
          <h1 class="font-bold">Dashboard</h1>
        </header>

        <main class="flex-1 p-6">
          ${content}
        </main>
      </div>
    </div>
  `;
}