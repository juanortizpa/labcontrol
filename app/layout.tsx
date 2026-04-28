import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'LabControl — Control de Equipos',
  description: 'Sistema de control de despacho y retorno de equipos metrológicos',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LabControl',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0d3b38" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  )
}
