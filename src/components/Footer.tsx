import { ArrowUpRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10 md:py-12 px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VCEL" className="h-6 w-auto" style={{ mixBlendMode: 'multiply' }} />
          <span className="text-[var(--text-light)] text-sm">·</span>
          <span className="text-[var(--text-muted)] text-xs">votrecommerceenligne.fr</span>
        </div>
        <div className="flex items-center gap-6 text-[var(--text-muted)] text-sm flex-wrap justify-center">
          <a href="#workflows" className="hover:text-[var(--navy)] transition-colors">Fonctionnalités</a>
          <a href="#tarifs"    className="hover:text-[var(--navy)] transition-colors">Tarifs</a>
          <a href="#faq"       className="hover:text-[var(--navy)] transition-colors">FAQ</a>
          <a href="mailto:hello@votrecommerceenligne.fr" className="hover:text-[var(--navy)] transition-colors">Contact</a>
          <a href="/login"     className="hover:text-[var(--navy)] transition-colors">Connexion</a>
        </div>
        <div className="text-[var(--text-light)] text-xs">© 2026 VCEL · Strasbourg 🇫🇷</div>
      </div>
    </footer>
  )
}