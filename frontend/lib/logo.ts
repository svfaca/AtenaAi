/**
 * Utilitário para obter URL do logo
 * Usa Route Handler para servir imagens, evitando problemas com arquivos estáticos no Vercel
 */

export function getLogoUrl(theme: 'light' | 'dark'): string {
  const filename = theme === 'dark'
    ? 'logo-icon-dark-20260627.png'
    : 'logo-icon-ligth-20260627.png'
  return `/api/logo/${filename}`
}
