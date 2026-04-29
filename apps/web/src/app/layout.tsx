import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'OrionOps - Enterprise Service Orchestration',
    template: '%s | OrionOps',
  },
  description:
    'Enterprise-grade IT Service Management, ERP, and service orchestration platform',
  keywords: ['ITSM', 'ERP', 'Service Management', 'Incident Management', 'Change Management'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('orionops_theme');
                  if (theme && ['light', 'dark', 'high-contrast'].indexOf(theme) !== -1) {
                    document.documentElement.setAttribute('data-theme', theme);
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    var prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
                    if (prefersContrast) {
                      document.documentElement.setAttribute('data-theme', 'high-contrast');
                    } else if (prefersDark) {
                      document.documentElement.setAttribute('data-theme', 'dark');
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* Skip to content link for keyboard/screen reader users */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <div id="root" suppressHydrationWarning>
          {children}
        </div>
      </body>
    </html>
  );
}
