import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <Zap size={13} className="text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-white text-sm">VCEL</span>
          <span className="text-white/15 text-sm">·</span>
          <span className="text-white/20 text-xs">votrecommerceenligne.fr</span>
        </div>

        <div className="flex items-center gap-6 text-white/25 text-sm">
          <a href="#workflows" className="hover:text-white/50 transition-colors">Fonctionnalités</a>
          <a href="#tarifs" className="hover:text-white/50 transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-white/50 transition-colors">FAQ</a>
          <a href="mailto:hello@votrecommerceenligne.fr" className="hover:text-white/50 transition-colors">Contact</a>
          <a href="/login" className="hover:text-white/50 transition-colors">Connexion</a>
        </div>

        <div className="flex items-center gap-3 text-white/15 text-xs">
          <span>© 2026 VCEL</span>
          <span>·</span>
          <span>Strasbourg 🇫🇷</span>
        </div>
      </div>
    </footer>
  )
}
