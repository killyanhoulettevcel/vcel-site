'use client'
import { FileText, Bell, BarChart2, PenLine, UserPlus, ScanLine, Landmark, Bot } from 'lucide-react'

const workflows = [
  { num: '01', icon: FileText,  title: 'Dashboard financier',       desc: 'Synchronisation de votre CA, charges et marge depuis Google Sheets. Mise à jour automatique chaque semaine.',  tag: 'Finance',      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
  { num: '02', icon: Bell,      title: 'Résumé hebdo IA',           desc: 'Chaque lundi, un email personnalisé avec vos chiffres clés, vos leads en attente et un conseil actionnable.',   tag: 'IA',           color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  { num: '03', icon: UserPlus,  title: 'CRM Leads',                 desc: 'Suivi de vos prospects : statut, score, dernière relance. Filtres et notes intégrés.',                          tag: 'Commercial',   color: 'text-cyan-600',   bg: 'bg-cyan-50 border-cyan-100' },
  { num: '04', icon: BarChart2, title: 'Reporting CA',              desc: 'Graphiques d\'évolution mensuelle et trimestrielle. Exportable et consultable depuis le dashboard.',            tag: 'Analytique',   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100' },
  { num: '05', icon: FileText,  title: 'Gestion factures',          desc: 'Suivi des factures émises et impayées. Alertes automatiques sur les retards de paiement.',                      tag: 'Comptabilité', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  { num: '06', icon: PenLine,   title: 'Coach IA business',         desc: 'Posez vos questions à votre coach IA. Il connaît vos chiffres et vos objectifs pour répondre précisément.',    tag: 'IA',           color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  { num: '07', icon: ScanLine,  title: 'Synchronisation Google',    desc: 'Connexion bidirectionnelle avec Google Sheets. Vos données restent dans vos outils existants.',               tag: 'Intégration',  color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-100' },
  { num: '08', icon: Landmark,  title: 'Objectifs & suivi',         desc: 'Définissez vos objectifs mensuels. Le dashboard suit votre progression et vous alerte en cas de retard.',      tag: 'Pilotage',     color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
]

export default function Workflows() {
  return (
    <section id="workflows" className="relative py-20 md:py-28 px-6 bg-cream-100">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16">
          <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Fonctionnalités</p>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--navy)] mb-4 max-w-xl">
            Tout ce dont vous avez besoin, rien de superflu
          </h2>
          <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-xl">
            8 modules connectés entre eux. Vos données, votre stack Google, votre coach IA personnel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {workflows.map((w) => (
            <div key={w.num}
              className={`bg-white border rounded-2xl p-5 hover:shadow-md-navy transition-all duration-200 ${w.bg}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm-navy`}>
                  <w.icon size={16} className={w.color} />
                </div>
                <span className="text-[10px] font-semibold text-[var(--text-light)] font-mono">{w.num}</span>
              </div>
              <h3 className="font-semibold text-[var(--navy)] text-sm mb-2 leading-tight">{w.title}</h3>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{w.desc}</p>
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <span className="text-[10px] font-semibold text-[var(--text-light)] uppercase tracking-wide">{w.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}