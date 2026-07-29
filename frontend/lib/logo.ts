/**
 * Utilitário para obter URL do logo com base no tema.
 * 
 * Usa caminhos relativos para arquivos em public/ que o Next.js serve diretamente.
 * Com unoptimized: true no next.config.js, o next/image não tenta otimizar PNGs.
 */

export function getLogoUrl(theme: string): string {
  const isDark = theme === 'dark'
  return isDark
    ? '/logo/logo-icon-dark-20260627.png'
    : '/logo/logo-icon-ligth-20260627.png'
}
