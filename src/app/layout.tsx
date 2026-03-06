import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VCEL — Automatisez 20h/sem en 10 minutes',
  description: '8 workflows n8n prêts-à-lancer pour solopreneurs et PME. Devis, CRM, CA, posts réseaux — tout automatisé.',
  keywords: 'automatisation, n8n, solopreneur, PME, workflows, no-code, VCEL',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body>{children}</body>
    </html>
  )
}
