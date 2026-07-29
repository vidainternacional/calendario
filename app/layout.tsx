import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './mobile-fixes.css'
import './dialog-transitions.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Vida Internacional',
    template: '%s | Vida Internacional',
  },
  description: 'App de servidores y ministerios — Vida Internacional',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vida Internacional',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#C0392B',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

const bibleThemeBootstrap = `
  (() => {
    try {
      if (!window.location.pathname.startsWith('/biblia')) return
      const raw = window.localStorage.getItem('vida-biblia-preferencias')
      const storedMode = raw ? JSON.parse(raw)?.modo : 'claro'
      const mode = storedMode === 'oscuro' || storedMode === 'sepia' ? storedMode : 'claro'
      document.documentElement.dataset.bibliaTema = mode
    } catch {}
  })()
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bibleThemeBootstrap }} />
        <link rel="apple-touch-icon" sizes="180x180" href="/api/icon/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/api/icon/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vida" />
      </head>
      <body className="min-h-full bg-[#f4f5f9] text-[#171923] font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
