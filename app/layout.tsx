import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000',
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
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script para aplicar tema antes de la hidratación */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Ignorar errores de localStorage
                }
              })();
            `,
          }}
        />
        {/* Preconnect a dominios externos para mejor rendimiento */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Polyfills para compatibilidad de navegadores */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Polyfills básicos para compatibilidad
              (function() {
                // Polyfill para Object.assign
                if (typeof Object.assign !== 'function') {
                  Object.assign = function(target) {
                    if (target == null) {
                      throw new TypeError('Cannot convert undefined or null to object');
                    }
                    var to = Object(target);
                    for (var index = 1; index < arguments.length; index++) {
                      var nextSource = arguments[index];
                      if (nextSource != null) {
                        for (var nextKey in nextSource) {
                          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                          }
                        }
                      }
                    }
                    return to;
                  };
                }
                
                // Polyfill para String.includes
                if (!String.prototype.includes) {
                  String.prototype.includes = function(search, start) {
                    if (typeof start !== 'number') {
                      start = 0;
                    }
                    if (start + search.length > this.length) {
                      return false;
                    } else {
                      return this.indexOf(search, start) !== -1;
                    }
                  };
                }
                
                // Polyfill para Array.includes
                if (!Array.prototype.includes) {
                  Array.prototype.includes = function(searchElement, fromIndex) {
                    if (this == null) {
                      throw new TypeError('"this" is null or not defined');
                    }
                    var o = Object(this);
                    var len = parseInt(o.length, 10) || 0;
                    if (len === 0) {
                      return false;
                    }
                    var n = parseInt(fromIndex, 10) || 0;
                    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
                    function sameValueZero(x, y) {
                      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
                    }
                    for (; k < len; k++) {
                      if (sameValueZero(o[k], searchElement)) {
                        return true;
                      }
                    }
                    return false;
                  };
                }
              })();
              
              // Script de redirección para localhost
              (function() {
                if (typeof window !== 'undefined') {
                  const urlParams = new URLSearchParams(window.location.search);
                  const code = urlParams.get('code');
                  const type = urlParams.get('type');
                  const currentHost = window.location.host;
                  const currentOrigin = window.location.origin;
                  const productionUrl = '${productionUrl}';
                  
                  if (code && (currentHost.includes('localhost') || currentOrigin.includes('localhost'))) {
                    if (type === 'recovery') {
                      window.location.replace(productionUrl + '/auth/callback?code=' + encodeURIComponent(code) + '&type=recovery&next=/reset-password');
                    } else {
                      window.location.replace(productionUrl + '/auth/callback?code=' + encodeURIComponent(code));
                    }
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        {children}
      </body>
    </html>
  )
}

