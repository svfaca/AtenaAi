/** @type {import('next').NextConfig} */

// 🔒 Headers de segurança (CSP, clickjacking, referrer, permissions).
// O backend já envia security headers; aqui protegemos a camada do navegador
// (a UI principal é servida pelo Next.js).
//
// CSP: script-src usa 'unsafe-inline' porque o layout.tsx injeta scripts
// inline (theme dark-mode + fix de pointer capture) e o Next.js em produção
// também. Ainda assim bloqueia scripts de ORIGENS EXTERNAS (principal vetor
// de XSS). Para hardening total, migrar para nonce + 'strict-dynamic' futuramente.

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Backend usado em conexões diretas (avatares, streaming, websocket).
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-110f3.up.railway.app'
).replace(/\/$/, '')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${BACKEND_URL}`,
      "font-src 'self' data:",
      // ws:/wss: para o chat em tempo real (group-chat via WebSocket)
      `connect-src 'self' ${BACKEND_URL} ws: wss:`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(IS_PRODUCTION ? ['upgrade-insecure-requests'] : []),
    ].join('; '),
  },
]

if (IS_PRODUCTION) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  })
}

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig

