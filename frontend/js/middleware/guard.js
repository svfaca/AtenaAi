import { getState, setState } from "../store.js";

// =========================
// GUARD.JS - SISTEMA DE AUTORIZAÇÃO
// =========================
// Este script executa IMEDIATAMENTE para bloquear acesso não autorizado
// Ele deve ser o PRIMEIRO script a carregar em cada página

(async () => {
  console.log("[🔐 GUARD] 🚀 Iniciando guard.js (módulo dinâmico)");
  
  // Flag para avisar que guard iniciou
  window.__guardStarted = true;
  window.__guardLoaded = true;
  
  try {
    const clearPageData = () => {};
  const getAuth = () => getState();
  const getAuthToken = () => getAuth().token;
  const getAuthUser = () => getAuth().user;

  // ========================
  // CONFIGURAÇÃO DE ROTAS
  // ========================
  const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/quem-somos"];
  
  const PROTECTED_ROUTES = {
    "/estudante": ["student"],
    "/professor": ["teacher", "admin"],
    "/sala": ["student", "teacher", "admin"],  // 🔥 FIX: Permite todos os roles autenticados
    "/admin": ["admin"]
  };

  const ROLE_DEFAULT_PATH = {
    "student": "/estudante",
    "teacher": "/professor",
    "admin": "/professor"
  };

  // ========================
  // HELPERS
  // ========================
  
  /**
   * Normaliza o pathname para comparação
   */
  function normalizePath(pathname) {
    // Remove trailing slashes e index.html
    let normalized = pathname
      .replace(/\/index\.html$/i, "")
      .replace(/\/$/, "");
    
    // Se for vazio ou "/frontend", considerar como root
    if (!normalized || normalized === "/frontend") {
      return "/";
    }
    
    return normalized;
  }

  /**
   * Identifica qual é a rota protegida que o usuário está tentando acessar
   */
  function getProtectedRoute(pathname) {
    const normalized = normalizePath(pathname);
    
    // Verificar correspondência exata
    for (const route of Object.keys(PROTECTED_ROUTES)) {
      if (normalized === route) {
        return route;
      }
    }
    
    // Verificar prefixo (ex: /estudante/room123 -> /estudante)
    for (const route of Object.keys(PROTECTED_ROUTES)) {
      if (normalized.startsWith(route + "/")) {
        return route;
      }
    }
    
    return null;
  }

  /**
   * Verifica se uma rota é pública
   */
  function isPublicRoute(pathname) {
    const normalized = normalizePath(pathname);
    
    if (normalized === "/") return true;
    
    for (const route of PUBLIC_ROUTES) {
      if (normalized.startsWith(route)) return true;
    }
    
    return false;
  }

  function getPathForRole(role) {
    return ROLE_DEFAULT_PATH[role] || "/";
  }

  // ========================
  // EXECUÇÃO
  // ========================
  
  const pathname = window.location.pathname;
  let isAuth = !!getAuthToken();
  let user = getAuthUser();
  
  // 🔄 SE NÃO TEM TOKEN NO STORE, TENTAR BUSCAR DO BACKEND USANDO COOKIES
  if (!isAuth || !user) {
    try {
      const { API_BASE_URL } = await import("../core/config.js");
      
      console.log("[🔐 GUARD] 🔍 Tentando hidratar usuário via cookies...", { isAuth, userExists: !!user });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        credentials: 'include'
      });

      console.log("[🔐 GUARD] Response status:", response.status);

      if (response.ok) {
        const serverUser = await response.json();
        console.log("[🔐 GUARD] ✅ Usuário carregado via cookies:", {
          id: serverUser.id,
          email: serverUser.email,
          full_name: serverUser.full_name,
          nickname: serverUser.nickname,
          role: serverUser.role
        });
        setState({ user: serverUser, role: serverUser.role });
        user = serverUser;
        isAuth = true;
      } else {
        console.log("[🔐 GUARD] ⚠️ /auth/me retornou:", response.status);
      }
    } catch (error) {
      console.error("[🔐 GUARD] ❌ Erro ao hidratar via cookies:", error.message);
    }
  }
  
  console.log("[🔐 GUARD] Estado após hidratação:", {
    pathname,
    normalized: normalizePath(pathname),
    isAuth,
    role: user?.role,
    publicRoute: isPublicRoute(pathname),
    protectedRoute: getProtectedRoute(pathname)
  });

  // ➕ CASO 1: Não autenticado
  if (!isAuth) {
    if (!isPublicRoute(pathname)) {
      console.warn("[🔐 GUARD] ❌ Não autenticado em rota protegida - redirecionando para login");
      window.location.assign("/frontend/login/index.html");
      return;
    }
    console.log("[🔐 GUARD] ✅ Rota pública (sem autenticação)");
    // Liberar página para rota pública
    document.body?.classList.add('auth-allowed');
    window.dispatchEvent(new Event('authHydrated'));
    return;
  }

  // ➕ CASO 3: Autenticado mas sem role
  if (!user?.role) {
    console.warn("[🔐 GUARD] ⚠️ Autenticado mas sem role");
    if (!isPublicRoute(pathname)) {
      console.warn("[🔐 GUARD] ❌ Rota protegida sem role - redirecionando para login");
      window.location.assign("/frontend/login/index.html");
      return;
    }
    // Liberar página para rota pública
    document.body?.classList.add('auth-allowed');
    window.dispatchEvent(new Event('authHydrated'));
    return;
  }

  const userRole = user.role;
  const protectedRoute = getProtectedRoute(pathname);
  const isPublic = isPublicRoute(pathname);

  // ➕ CASO 4: Autenticado em rota protegida
  if (protectedRoute) {
    const allowedRoles = PROTECTED_ROUTES[protectedRoute];
    
    if (!allowedRoles.includes(userRole)) {
      console.error(
        `[🔐 GUARD] ❌ ACESSO NEGADO: Role '${userRole}' não pode acessar '${protectedRoute}'. Roles permitidos: ${allowedRoles.join(", ")}`
      );
      const targetPath = getPathForRole(userRole);
      // Limpar dados em memória antes de redirecionar
      clearPageData();
      
      window.location.assign(`/frontend${targetPath}/index.html`);
      return;
    }
    
    console.log(`[🔐 GUARD] ✅ Acesso permitido (${userRole} em ${protectedRoute})`);
    // Liberar página para rota protegida
    document.body?.classList.add('auth-allowed');
    window.dispatchEvent(new Event('authHydrated'));
    return;
  }

  // ➕ CASO 5: Autenticado em rota pública
  if (isPublic) {
    // Evitar loop infinito com flag em sessionStorage
    const redirectFlag = `_guard_from_${normalizePath(pathname)}`;
    if (sessionStorage.getItem(redirectFlag)) {
      // Liberar página
      document.body?.classList.add('auth-allowed');
      window.dispatchEvent(new Event('authHydrated'));
      return;
    }

    const targetPath = getPathForRole(userRole);
    if (normalizePath(pathname) !== normalizePath(targetPath)) {
      console.log(`[🔐 GUARD] 🔄 Autenticado em página pública (${userRole}) → ${targetPath}`);
      sessionStorage.setItem(redirectFlag, "true");
      window.location.assign(`/frontend${targetPath}/index.html`);
      return;
    }
  }
  // 🔓 LIBERAR PÁGINA - Adicionar classe auth-allowed
  // Isso permite que os scripts de renderização façam seu trabalho
  console.log("[🔐 GUARD] ✅ LIBERANDO PÁGINA - Adicionando auth-allowed");
  document.body?.classList.add('auth-allowed');
  
  // 🎯 AVISAR AO APP.JS QUE HIDRATAÇÃO ESTÁ COMPLETA
  window.dispatchEvent(new Event('authHydrated'));
  console.log("[🔐 GUARD] ✅ Evento 'authHydrated' disparado");
  } catch (err) {
    console.error("[🔐 GUARD] ❌ ERRO NO GUARD:", err);
    console.error(err.stack);
    
    // Mesmo com erro, liberar página
    document.body?.classList.add('auth-allowed');
    window.dispatchEvent(new Event('authHydrated'));
  }
})();
