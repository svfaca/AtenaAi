// Theme toggle + logo swap
function updateAllLogos() {
  const isDark = document.documentElement.classList.contains("dark");
  document.querySelectorAll('[data-theme-logo]').forEach((img) => {
    const srcAttr = img.getAttribute("src") || "";
    const lastSlash = srcAttr.lastIndexOf("/");
    const base = lastSlash >= 0 ? srcAttr.slice(0, lastSlash + 1) : "";
    const filename = isDark ? "logo-icon-dark.png" : "logo-icon-ligth.png";
    img.setAttribute("src", `${base}${filename}`);
  });
}

function applyInitialTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  updateAllLogos();
}

export function initThemeToggle() {
  applyInitialTheme();
  const toggle = document.getElementById("theme-toggle");
  if (!toggle || toggle.dataset.bound === "true") return;

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateAllLogos();
  });

  toggle.dataset.bound = "true";
}
