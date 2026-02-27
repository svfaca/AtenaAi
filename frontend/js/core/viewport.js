export function initViewportHeight() {
  const setVH = () => {
    const vhSource = window.visualViewport?.height ?? window.innerHeight;
    const vh = vhSource * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setVH();

  window.addEventListener("resize", setVH);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setVH);
  }

  return () => {
    window.removeEventListener("resize", setVH);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", setVH);
    }
  };
}
