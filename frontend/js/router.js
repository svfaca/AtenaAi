import { getState, setState, isStudent, isTeacher, isAdmin } from './store.js';
import { renderHome } from './pages/home.js';
import { renderEstudante } from './pages/estudante.js';
import { renderProfessor } from './pages/professor.js';
import { renderAbout } from './pages/about.js';

const routes = {
  '/': { view: renderHome },
  '/quem-somos': { view: renderAbout },
  '/estudante': {
    view: renderEstudante,
    meta: { requiresStudent: true, redirectOnFail: '/' },
  },
  '/professor': {
    view: renderProfessor,
    meta: { requiresTeacher: true, redirectOnFail: '/' },
  },
};

const defaultRoute = routes['/'];

let currentPageCleanup = null;

function normalizePath(path) {
  if (path.startsWith('/frontend')) {
    return path.replace('/frontend', '') || '/';
  }

  return path;
}

function resolveRoute(path) {
  return routes[path] || defaultRoute;
}

function getRouteGuardRedirect(route) {
  const meta = route?.meta;
  if (!meta) return null;

  const state = getState();

  if (meta.requiresTeacher && !isTeacher(state)) {
    return meta.redirectOnFail || '/';
  }

  if (meta.requiresStudent && !isStudent(state)) {
    return meta.redirectOnFail || '/';
  }

  if (meta.requiresAdmin && !isAdmin(state)) {
    return meta.redirectOnFail || '/';
  }

  return null;
}

export function router() {
  let path = normalizePath(window.location.pathname);
  let route = resolveRoute(path);
  const state = getState();
  
  console.log("[🎯 ROUTER] Iniciando renderização:", {path, role: state.role});
  
  const redirect = getRouteGuardRedirect(route);

  if (redirect) {
    console.log("[🎯 ROUTER] 🔄 Redirecionando:", {from: path, to: redirect});
    path = redirect;
    window.history.replaceState({}, '', path);
    route = resolveRoute(path);
  }

  console.log("[🎯 ROUTER] 📄 Renderizando:", {path, role: state.role});
  setState({ route: path });

  currentPageCleanup?.();
  currentPageCleanup = null;

  const cleanup = route.view();
  if (typeof cleanup === 'function') {
    currentPageCleanup = cleanup;
  }
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  router();
}

window.addEventListener('popstate', router);

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link]');
  if (!link) return;

  e.preventDefault();
  navigate(link.getAttribute('href'));
});