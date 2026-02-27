import { openModal, subscribe, logout } from "../../store.js";

export function initHeader() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const cleanupTasks = [];

  if (!menuBtn || !mobileMenu) {
    return () => {};
  }

  const toggleMenu = () => mobileMenu.classList.toggle("hidden");
  menuBtn.addEventListener("click", toggleMenu);
  cleanupTasks.push(() => menuBtn.removeEventListener("click", toggleMenu));

  mobileMenu.querySelectorAll("a").forEach((link) => {
    const handleLinkClick = () => {
      mobileMenu.classList.add("hidden");
    };
    link.addEventListener("click", handleLinkClick);
    cleanupTasks.push(() => link.removeEventListener("click", handleLinkClick));
  });

  const handleDocumentClick = (e) => {
    if (
      !mobileMenu.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      mobileMenu.classList.add("hidden");
    }
  };
  document.addEventListener("click", handleDocumentClick);
  cleanupTasks.push(() => document.removeEventListener("click", handleDocumentClick));

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      mobileMenu.classList.add("hidden");
    }
  };
  window.addEventListener("resize", handleResize);
  cleanupTasks.push(() => window.removeEventListener("resize", handleResize));

  const modalCleanup = setupModalButtons();
  cleanupTasks.push(modalCleanup);

  const logoutCleanup = setupLogoutButtons();
  cleanupTasks.push(logoutCleanup);

  const unsubscribe = subscribe((state) => updateAuthUIState(state));
  cleanupTasks.push(unsubscribe);

  return () => {
    cleanupTasks.forEach((cleanup) => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    });
  };
}

function setupModalButtons() {
  const cleanupTasks = [];
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");

  if (loginBtn) {
    const handleClick = (e) => {
      e.preventDefault();
      openModal("login");
    };
    loginBtn.addEventListener("click", handleClick);
    cleanupTasks.push(() => loginBtn.removeEventListener("click", handleClick));
  }

  if (registerBtn) {
    const handleClick = (e) => {
      e.preventDefault();
      openModal("register");
    };
    registerBtn.addEventListener("click", handleClick);
    cleanupTasks.push(() => registerBtn.removeEventListener("click", handleClick));
  }

  const mobileLoginBtn = document.getElementById("mobile-login-btn");
  const mobileRegisterBtn = document.getElementById("mobile-register-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileLoginBtn) {
    const handleClick = (e) => {
      e.preventDefault();
      openModal("login");
      mobileMenu?.classList.add("hidden");
    };
    mobileLoginBtn.addEventListener("click", handleClick);
    cleanupTasks.push(() => mobileLoginBtn.removeEventListener("click", handleClick));
  }

  if (mobileRegisterBtn) {
    const handleClick = (e) => {
      e.preventDefault();
      openModal("register");
      mobileMenu?.classList.add("hidden");
    };
    mobileRegisterBtn.addEventListener("click", handleClick);
    cleanupTasks.push(() => mobileRegisterBtn.removeEventListener("click", handleClick));
  }

  return () => cleanupTasks.forEach((cleanup) => cleanup());
}

function setupLogoutButtons() {
  const cleanupTasks = [];
  const logoutBtn = document.getElementById("logout-btn");
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (logoutBtn) {
    const handleClick = (e) => {
      e.preventDefault();
      logout();
    };
    logoutBtn.addEventListener("click", handleClick);
    cleanupTasks.push(() => logoutBtn.removeEventListener("click", handleClick));
  }

  if (mobileLogoutBtn) {
    const handleClick = (e) => {
      e.preventDefault();
      logout();
      mobileMenu?.classList.add("hidden");
    };
    mobileLogoutBtn.addEventListener("click", handleClick);
    cleanupTasks.push(() => mobileLogoutBtn.removeEventListener("click", handleClick));
  }

  return () => cleanupTasks.forEach((cleanup) => cleanup());
}

function updateAuthUIState(state) {
  const menuNotLogged = document.getElementById("menu-not-logged");
  const menuLogged = document.getElementById("menu-logged");
  const mobileMenuNotLogged = document.getElementById("mobile-menu-not-logged");
  const mobileMenuLogged = document.getElementById("mobile-menu-logged");

  if (!menuNotLogged) return;

  // ✅ Verificar apenas user e role (não token, pois está em HttpOnly cookies)
  if (state.user && state.role) {
    menuNotLogged.classList.add("hidden");
    if (menuLogged) {
      menuLogged.classList.remove("hidden");
    }
    if (mobileMenuNotLogged) {
      mobileMenuNotLogged.classList.add("hidden");
    }
    if (mobileMenuLogged) {
      mobileMenuLogged.classList.remove("hidden");
    }
  } else {
    menuNotLogged.classList.remove("hidden");
    if (menuLogged) {
      menuLogged.classList.add("hidden");
    }
    if (mobileMenuNotLogged) {
      mobileMenuNotLogged.classList.remove("hidden");
    }
    if (mobileMenuLogged) {
      mobileMenuLogged.classList.add("hidden");
    }
  }
}