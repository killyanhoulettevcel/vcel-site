'use client'
import { FileText, Bell, BarChart2, PenLine, UserPlus, Share2, ScanLine, Landmark } from 'lucide-react'

const workflows = [
  {
    num: '01',
    icon: FileText,
    title: 'Devis & Factures PDP 2026',
    gain: '6h / sem',
    desc: 'Génération automatique devis/factures conforme réforme PDP 2026. Stripe → PDF → envoi client.',
    status: 'ready',
    tag: 'Conformité',
  },
  {
    num: '02',
    icon: Bell,
    title: 'Relances Clients Auto',
    gain: '3h / sem',
    desc: 'Séquence de relance intelligente par email selon le statut de paiement. Zéro impayé oublié.',
    status: 'ready',
    tag: 'Recouvrement',
  },
  {
    num: '03',
    icon: BarChart2,
    title: 'Reporting CA Dashboard',
    gain: '2h / sem',
    desc: 'Dashboard CFO hebdo/mensuel/trimestriel avec conseil IA. Directement dans Gmail + Sheets.',
    status: 'ready',
    tag: 'Finance',
  },
  {
    num: '04',
    icon: PenLine,
    title: 'Signature Contrats',
    gain: '2h / sem',
    desc: 'Envoi et suivi signature contrats via Universign. Notification auto à la signature.',
    status: 'ready',
    tag: 'Juridique',
  },
  {
    num: '05',
    icon: UserPlus,
    title: 'Leads Forms → CRM',
    gain: '2h / sem',
    desc: 'Capture leads Gmail → extraction GPT-4o-mini → CRM Sheets + email de bienvenue auto.',
    status: 'ready',
    tag: 'CRM',
  },
  {
    num: '06',
    icon: Share2,
    title: 'Posts Réseaux Auto',
    gain: '2h / sem',
    desc: 'Génération et publication automatique LinkedIn / Instagram / TikTok selon votre planning.',
    status: 'ready',
    tag: 'Marketing',
  },
  {
    num: '07',
    icon: ScanLine,
    title: 'OCR Factures Fournisseurs',
    gain: '2h / sem',
    desc: 'PDF facture reçu par email → OCR + extraction GPT → Sheets comptabilité. Zéro saisie.',
    status: 'ready',
    tag: 'Comptabilité',
  },
  {
    num: '08',
    icon: Landmark,
    title: 'Alertes Budget Banque',
    gain: '1h / sem',
    desc: 'Connexion Tink/Indy → alertes automatiques si dépenses dépassent vos seuils définis.',
    status: 'ready',
    tag: 'Trésorerie',
  },
]

const tagColors: Record<string, string> = {
  Conformité: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  Recouvrement: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  Finance: 'bg-green-500/10 text-green-300 border-green-500/20',
  Juridique: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  CRM: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  Marketing: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  Comptabilité: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  Trésorerie: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
}

export default function Workflows() {
  return (
    <section id="workflows" className="relative py-28 px-6 overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] bg-blue-700/10 top-[20%] right-[-200px]" />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="section-label">
            <span className="w-4 h-px bg-blue-400" />
            Pack Starter VCEL
            <span className="w-4 h-px bg-blue-400" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            8 workflows,{' '}
            <span className="text-blue-400">20h récupérées</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Chaque workflow livré en JSON + vidéo setup 2 minutes. Actif le jour même.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflows.map((w) => (
            <div key={w.num}
              className="card-glass p-5 group hover:border-blue-400/30 transition-all duration-300 hover:-translate-y-1 cursor-default">

              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <w.icon size={18} className="text-blue-400" />
                </div>
                <span className="font-display text-3xl font-bold text-white/5 group-hover:text-white/10 transition-colors select-none">
                  {w.num}
                </span>
              </div>

              {/* Tag */}
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${tagColors[w.tag]}`}>
                {w.tag}
              </span>

              {/* Content */}
              <h3 className="font-display font-semibold text-white text-sm mb-2 leading-tight">{w.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed mb-4">{w.desc}</p>

              {/* Gain */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs text-white/30">Gain estimé</span>
                <span className="text-xs font-semibold text-green-400">+{w.gain}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-10 card-glass p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white/40 text-sm mb-1">Gain total Pack Starter</p>
            <p className="font-display text-2xl font-bold text-white">
              20h <span className="text-white/30 font-normal text-lg">/ semaine</span>
              <span className="text-white/20 mx-3">→</span>
              200h <span className="text-white/30 font-normal text-lg">/ an</span>
              <span className="text-white/20 mx-3">→</span>
              <span className="text-green-400">10 000€</span> <span className="text-white/30 font-normal text-lg">valeur @25€/h</span>
            </p>
          </div>
          <a href="#tarifs" className="btn-primary shrink-0">
            Obtenir le Pack →
          </a>
        </div>
      </div>
    </section>
  )
}
