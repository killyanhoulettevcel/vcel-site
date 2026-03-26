import { Instagram, Linkedin, Youtube } from 'lucide-react'

const socials = [
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/killyan-houlette-35311b351/',
    color: '#0A66C2',
    bg: '#e8f0fe',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    href: 'https://www.instagram.com/vcel_votrecommerceenligne/',
    color: '#E1306C',
    bg: '#fce4ec',
  },
  {
    icon: Youtube,
    label: 'TikTok',
    href: 'https://www.tiktok.com/@vcel_vcel',
    color: '#000000',
    bg: '#f5f5f5',
    tiktok: true,
  },
]

// Icône TikTok custom (pas dans lucide)
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.54V6.77a4.84 4.84 0 01-1.02-.08z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="border-t py-10 md:py-14 px-4 md:px-6 bg-white" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Ligne principale */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'darken' }} />
            <span className="text-xs" style={{ color: '#7A90A4' }}>vcel.fr</span>
          </div>

          <div className="flex items-center gap-5 md:gap-6 text-sm flex-wrap justify-center" style={{ color: '#7A90A4' }}>
            <a href="#workflows" className="hover:text-[#0D1B2A] transition-colors">Fonctionnalités</a>
            <a href="#tarifs"    className="hover:text-[#0D1B2A] transition-colors">Tarifs</a>
            <a href="#faq"       className="hover:text-[#0D1B2A] transition-colors">FAQ</a>
            <a href="mailto:contact@vcel.fr" className="hover:text-[#0D1B2A] transition-colors">Contact</a>
            <a href="/login"     className="hover:text-[#0D1B2A] transition-colors">Connexion</a>
          </div>

          {/* Réseaux sociaux */}
          <div className="flex items-center gap-3">
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.label}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                style={{ background: s.bg, color: s.color }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.color; (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = s.bg; (e.currentTarget as HTMLElement).style.color = s.color }}
              >
                {s.tiktok ? <TikTokIcon size={16} /> : <s.icon size={16} />}
              </a>
            ))}
          </div>
        </div>

        {/* CTA mini avant footer */}
        <div className="rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, #0D1B2A, #1e3a5f)', border: '1px solid rgba(79,195,247,0.15)' }}>
          <div>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 15 }}>Prêt à automatiser votre gestion ?</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>1er mois offert avec le code SOLOFREE · Opérationnel en 24h</p>
          </div>
          <a href="#tarifs"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#4FC3F7', color: '#0D1B2A' }}>
            Commencer gratuitement →
          </a>
        </div>

        {/* Ligne légale */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t text-xs"
          style={{ borderColor: 'rgba(13,27,42,0.06)', color: '#A8BDD0' }}>
          <span>KILLYAN HOULETTE · SIRET 948 881 297 00014 · © 2026 VCEL 🇫🇷</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="/legal"                     className="hover:text-[#0D1B2A] transition-colors">Mentions légales</a>
            <a href="/legal?tab=cgv"             className="hover:text-[#0D1B2A] transition-colors">CGV</a>
            <a href="/legal?tab=cgu"             className="hover:text-[#0D1B2A] transition-colors">CGU</a>
            <a href="/legal?tab=confidentialite" className="hover:text-[#0D1B2A] transition-colors">Confidentialité</a>
          </div>
        </div>

      </div>
    </footer>
  )
}