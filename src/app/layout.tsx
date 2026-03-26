import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VCEL — Automatisez votre gestion d\'entreprise',
  description: 'Dashboard financier, CRM leads, coach IA — pour solopreneurs et TPE/PME',
  metadataBase: new URL('https://vcel.fr'),
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

        {/* Préconnexion Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Fonts non-bloquantes avec font-display:swap */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        {/* Fallback no-JS */}
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  )
}