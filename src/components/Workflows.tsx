'use client'
import { FileText, Bell, BarChart2, PenLine, UserPlus, Share2, ScanLine, Landmark } from 'lucide-react'

const workflows = [
  { num: '01', icon: FileText,  title: 'Dashboard financier',       desc: 'Synchronisation de votre CA, charges et marge depuis Google Sheets. Mise à jour automatique chaque semaine.',  tag: 'Finance',      color: 'text-blue-400',   bg: 'bg-blue-500/8 border-blue-500/15' },
  { num: '02', icon: Bell,      title: 'Résumé hebdo IA',           desc: 'Chaque lundi, un email personnalisé avec vos chiffres clés, vos leads en attente et un conseil actionnable.', tag: 'IA',           color: 'text-violet-400', bg: 'bg-violet-500/8 border-violet-500/15' },
  { num: '03', icon: UserPlus,  title: 'CRM Leads',                 desc: 'Suivi de vos prospects : statut, score, dernière relance. Filtres et notes intégrés.',                          tag: 'Commercial',   color: 'text-cyan-400',   bg: 'bg-cyan-500/8 border-cyan-500/15' },
  { num: '04', icon: BarChart2, title: 'Reporting CA',              desc: 'Graphiques d\'évolution mensuelle et trimestrielle. Exportable et consultable depuis le dashboard.',             tag: 'Analytique',   color: 'text-green-400',  bg: 'bg-green-500/8 border-green-500/15' },
  { num: '05', icon: FileText,  title: 'Gestion factures',          desc: 'Suivi des factures émises et impayées. Alertes automatiques sur les retards de paiement.',                      tag: 'Comptabilité', color: 'text-orange-400', bg: 'bg-orange-500/8 border-orange-500/15' },
  { num: '06', icon: PenLine,   title: 'Coach IA business',         desc: 'Posez vos questions à votre coach IA. Il connaît vos chiffres et vos objectifs pour répondre précisément.',    tag: 'IA',           color: 'text-violet-400', bg: 'bg-violet-500/8 border-violet-500/15' },
  { num: '07', icon: ScanLine,  title: 'Synchronisation Google',    desc: 'Connexion bidirectionnelle avec Google Sheets. Vos données restent dans vos outils existants.',               tag: 'Intégration',  color: 'text-teal-400',   bg: 'bg-teal-500/8 border-teal-500/15' },
  { num: '08', icon: Landmark,  title: 'Objectifs & suivi',         desc: 'Définissez vos objectifs mensuels. Le dashboard suit votre progression et vous alerte en cas de retard.',      tag: 'Pilotage',     color: 'text-yellow-400', bg: 'bg-yellow-500/8 border-yellow-500/15' },
]

export default function Workflows() {
  return (
    <section id="workflows" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-16">
          <p className="text-blue-400 text-sm font-semibold mb-3 tracking-wide uppercase">Fonctionnalités</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 max-w-xl">
            Tout ce dont vous avez besoin, rien de superflu
          </h2>
          <p className="text-white/40 text-lg max-w-xl">
            8 modules connectés entre eux. Vos données, votre stack Google, votre coach IA personnel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflows.map((w) => (
            <div key={w.num}
              className={`border rounded-2xl p-5 hover:border-white/15 transition-all duration-200 ${w.bg}`}>
              <div className="flex items-start justify-between mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5`}>
                  <w.icon size={16} className={w.color} />
                </div>
                <span className="text-[10px] font-semibold text-white/20 font-mono">{w.num}</span>
              </div>
              <h3 className="font-display font-semibold text-white text-sm mb-2 leading-tight">{w.title}</h3>
              <p className="text-white/35 text-xs leading-relaxed">{w.desc}</p>
              <div className="mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wide">{w.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
