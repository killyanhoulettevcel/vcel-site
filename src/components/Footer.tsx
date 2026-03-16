export default function Footer() {
  return (
    <footer className="border-t py-10 md:py-12 px-6 bg-white" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Ligne principale */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'darken' }} />
            <span className="text-xs" style={{ color: '#7A90A4' }}>votrecommerceenligne.fr</span>
          </div>

          <div className="flex items-center gap-6 text-sm flex-wrap justify-center" style={{ color: '#7A90A4' }}>
            <a href="#workflows" className="hover:text-[#0D1B2A] transition-colors">Fonctionnalités</a>
            <a href="#tarifs"    className="hover:text-[#0D1B2A] transition-colors">Tarifs</a>
            <a href="#faq"       className="hover:text-[#0D1B2A] transition-colors">FAQ</a>
            <a href="mailto:contact@vcel.fr" className="hover:text-[#0D1B2A] transition-colors">Contact</a>
            <a href="/login"     className="hover:text-[#0D1B2A] transition-colors">Connexion</a>
          </div>

          <div className="text-xs" style={{ color: '#A8BDD0' }}>© 2026 VCEL · Trets 🇫🇷</div>
        </div>

        {/* Ligne légale */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 border-t text-xs"
          style={{ borderColor: 'rgba(13,27,42,0.06)', color: '#A8BDD0' }}>
          <span>KILLYAN HOULETTE · SIRET 948 881 297 00014</span>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <a href="/legal"                      className="hover:text-[#0D1B2A] transition-colors">Mentions légales</a>
            <a href="/legal?tab=cgv"              className="hover:text-[#0D1B2A] transition-colors">CGV</a>
            <a href="/legal?tab=cgu"              className="hover:text-[#0D1B2A] transition-colors">CGU</a>
            <a href="/legal?tab=confidentialite"  className="hover:text-[#0D1B2A] transition-colors">Confidentialité</a>
          </div>
        </div>

      </div>
    </footer>
  )
}