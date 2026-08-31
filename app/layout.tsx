import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import NotebookEditorBehavior from '@/components/biblia/NotebookEditorBehavior'
import './globals.css'
import './mobile-fixes.css'
import './dialog-transitions.css'
import './notebook-fixes.css'
import './cuaderno-fase-g.css'

const inter = Inter({
  subsets: ['latin'],
  style: ['normal', 'italic'],
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
      const pathname = window.location.pathname
      const esRutaCuaderno = pathname === '/biblia/notas'
        || pathname.startsWith('/biblia/notas/')
        || pathname === '/biblia/notas-offline'
        || pathname.startsWith('/biblia/notas-offline/')

      if (esRutaCuaderno) {
        delete document.documentElement.dataset.bibliaTema
        document.documentElement.dataset.vidaCuadernoTarget = 'true'
        document.documentElement.style.colorScheme = 'light'
        return
      }

      delete document.documentElement.dataset.vidaCuadernoTarget

      if (!pathname.startsWith('/biblia')) {
        delete document.documentElement.dataset.bibliaTema
        document.documentElement.style.colorScheme = 'light'
        return
      }

      const raw = window.localStorage.getItem('vida-biblia-preferencias')
      const storedMode = raw ? JSON.parse(raw)?.modo : 'claro'
      const mode = storedMode === 'oscuro' || storedMode === 'sepia' ? storedMode : 'claro'
      document.documentElement.dataset.bibliaTema = mode
      document.documentElement.style.colorScheme = mode === 'oscuro' ? 'dark' : 'light'
    } catch {}
  })()
`

const pastoralLayersDirectCss = `
  .pastoral-editor-v4 .panel-capas [aria-label="Opciones de capas"] {
    display: none !important;
  }

  .pastoral-editor-v4 .panel-capas [aria-label="Opciones de capas"] + div {
    padding-top: 0 !important;
  }
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
        <style dangerouslySetInnerHTML={{ __html: pastoralLayersDirectCss }} />
        <link rel="apple-touch-icon" sizes="180x180" href="/api/icon/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/api/icon/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vida" />
      </head>
      <body className="min-h-full bg-[#f4f5f9] text-[#171923] font-sans antialiased">
        {children}
        <NotebookEditorBehavior />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async () => {
                  try {
                    const esPreviewVercel = window.location.hostname.endsWith('.vercel.app')

                    if (esPreviewVercel) {
                      const registrations = await navigator.serviceWorker.getRegistrations()
                      await Promise.all(registrations.map((registration) => registration.unregister()))

                      if ('caches' in window) {
                        const cacheNames = await caches.keys()
                        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
                      }
                      return
                    }

                    const registration = await navigator.serviceWorker.register('/sw.js', {
                      updateViaCache: 'none'
                    })
                    await registration.update()
                  } catch (error) {
                    console.error('[service-worker] No se pudo registrar, limpiar o actualizar:', error)
                  }
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}