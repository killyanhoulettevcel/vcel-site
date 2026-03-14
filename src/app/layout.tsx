import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VCEL — Automatisez votre gestion d\'entreprise',
  description: 'Dashboard financier, CRM leads, coach IA — pour solopreneurs et TPE/PME',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'VCEL',
    description: 'Dashboard financier, CRM leads, coach IA',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
