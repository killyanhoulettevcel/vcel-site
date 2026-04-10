import type { Metadata } from 'next'
import './globals.css'

export const viewport = {
  themeColor: '#0D1B2A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'VCEL — Logiciel de gestion pour solopreneurs et TPE/PME | Dashboard IA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VCEL',
  },
  formatDetection: { telephone: false },

  description: 'VCEL automatise votre gestion d\'entreprise : dashboard financier, CRM leads avec score IA, gestion des factures et coach IA personnel. Dès 19€/mois · 14 jours gratuits · sans engagement.',
  metadataBase: new URL('https://vcel.fr'),
  keywords: [
    'logiciel gestion solopreneur',
    'dashboard financier solopreneur',
    'CRM leads solopreneur',
    'automatisation gestion entreprise',
    'outil gestion TPE PME',
    'coach IA business',
    'gestion factures automatique',
    'synchronisation Google Sheets',
    'tableau de bord entrepreneur',
    'logiciel tout-en-un freelance',
  ],
  authors: [{ name: 'VCEL', url: 'https://vcel.fr' }],
  creator: 'VCEL',
  publisher: 'VCEL',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: { canonical: 'https://vcel.fr' },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://vcel.fr',
    siteName: 'VCEL',
    title: 'VCEL — Logiciel de gestion pour solopreneurs | Dashboard + CRM + Coach IA',
    description: 'Automatisez votre gestion d\'entreprise avec VCEL. Dashboard financier, CRM leads avec score IA, gestion des factures. Tout en un, connecté à Google Sheets. Dès 19€/mois.',
    images: [{
      url: '/logo.png',
      width: 400,
      height: 400,
      alt: 'VCEL — Logiciel de gestion solopreneur',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VCEL — Logiciel de gestion pour solopreneurs',
    description: 'Dashboard financier, CRM leads IA, gestion factures. Tout en un. Dès 19€/mois.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VCEL" />
        <link rel="apple-touch-icon" href="/icons/maskable-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/maskable-152x152.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/maskable-512x512.png" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#0D1B2A" />
        {/* Enregistrement Service Worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
        {/* Build ID pour reset auto du compteur maintenance */}
        <meta name="build-id" content={process.env.VERCEL_DEPLOYMENT_ID || process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || 'local'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap" />
        </noscript>

        {/* Schema.org JSON-LD — données structurées pour Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "VCEL",
            "url": "https://vcel.fr",
            "description": "Logiciel de gestion pour solopreneurs et TPE/PME. Dashboard financier, CRM leads avec score IA, gestion des factures et coach IA. Synchronisé avec Google Sheets.",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "19",
              "highPrice": "69",
              "priceCurrency": "EUR",
              "offerCount": "3",
              "offers": [
                { "@type": "Offer", "name": "Starter", "price": "19", "priceCurrency": "EUR" },
                { "@type": "Offer", "name": "Pro", "price": "39", "priceCurrency": "EUR" },
                { "@type": "Offer", "name": "Business", "price": "69", "priceCurrency": "EUR" }
              ]
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "50",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Killyan Houlette",
              "url": "https://vcel.fr"
            }
          })}}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}