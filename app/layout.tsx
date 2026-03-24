import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToasts from '@/components/ClientToasts'

// Optimización de fuente con display swap para mejor rendimiento
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'INAMI - Sistema de Gestión de Atenciones',
    template: '%s | INAMI',
  },
  description: 'Instituto Nacional para la Atención de Menores Infractores - Sistema de gestión de atenciones',
  keywords: ['INAMI', 'menores infractores', 'gestión', 'atenciones', 'sistema'],
  authors: [{ name: 'INAMI' }],
  creator: 'INAMI',
  publisher: 'INAMI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://qa.inamiunah.online'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://qa.inamiunah.online',
    siteName: 'INAMI',
    title: 'INAMI - Sistema de Gestión de Atenciones',
    description: 'Instituto Nacional para la Atención de Menores Infractores - Sistema de gestión de atenciones',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://qa.inamiunah.online'

  return (
    <html lang="es" suppressHydrationWarning data-production-url={productionUrl}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Script estático en public/: el navegador lo ejecuta; no usar next/script con inline en cliente (React 19) */}
        <script src="/scripts/before-hydration.js" />
      </head>
      <body className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
        <div id="__toasts">
          <ClientToasts />
        </div>
        {children}
      </body>
    </html>
  )
}
