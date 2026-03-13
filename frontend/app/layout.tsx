import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth';
import ThemeToggle from '@/components/ui/ThemeToggle';
import '@/styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Plataforma inteligente de educação com IA" />
        <meta name="keywords" content="educação, IA, ensino, learning" />
        <meta name="creator" content="AtenaAI Team" />
        <title>AtenaAI - Ensino Inteligente</title>
        <link rel="icon" href="/logo/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/logo/apple-touch-icon.png" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof Element === 'undefined') return;
                const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
                if (typeof originalReleasePointerCapture !== 'function') return;

                Element.prototype.releasePointerCapture = function(pointerId) {
                  try {
                    if (typeof this.hasPointerCapture === 'function' && this.hasPointerCapture(pointerId)) {
                      originalReleasePointerCapture.call(this, pointerId);
                    }
                  } catch (_err) {
                    // Ignore invalid pointer release attempts to keep UI handlers alive.
                  }
                };
              })();
            `,
          }}
        />
      </head>
      <body 
        className="antialiased h-full flex flex-col overflow-hidden bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200"
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <ThemeToggle />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
