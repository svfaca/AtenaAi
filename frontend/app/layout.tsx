import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider as ModalAuthProvider } from '@/components/auth/AuthContext';
import { AuthProvider as UserAuthProvider } from '@/lib/contexts/AuthContext';
import { AuthModals } from '@/components/auth/AuthModals';
import { getCurrentUser } from '@/lib/server-api';
import { isAuthenticated } from '@/lib/auth';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AtenaAI - Ensino Inteligente',
    template: '%s | AtenaAI',
  },
  description: 'Plataforma inteligente de educação com IA',
  keywords: ['educação', 'IA', 'ensino', 'learning'],
  creator: 'AtenaAI Team',
  icons: {
    icon: [
      { url: '/logo/favicon.ico', sizes: 'any' },
      { url: '/logo/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/logo/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

/**
 * 🔐 Carrega usuário no servidor
 * Garante que initialUser sempre está sincronizado com backend
 */
async function getInitialUser() {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) return null;

    const user = await getCurrentUser();
    return user;
  } catch (err) {
    console.error("[RootLayout] Erro ao carregar usuário:", err);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getInitialUser();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <UserAuthProvider initialUser={initialUser}>
          <ModalAuthProvider>
            <AuthModals />
            {children}
            <Toaster position="top-right" />
          </ModalAuthProvider>
        </UserAuthProvider>
      </body>
    </html>
  );
}
