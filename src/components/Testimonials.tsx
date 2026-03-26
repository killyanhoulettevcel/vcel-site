'use client'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    nom: 'Sophie R.',
    activite: 'Consultante RH indépendante',
    initiale: 'S',
    color: 'bg-purple-100 text-purple-600',
    etoiles: 5,
    texte: "Avant VCEL je passais 3h par semaine à mettre à jour mes tableaux. Maintenant tout est automatique. Le coach IA m'a aidé à identifier que mes relances factures trop tardives me coûtaient en moyenne 800€/mois.",
    highlight: '3h/semaine économisées',
  },
  {
    nom: 'Marc T.',
    activite: 'Formateur & créateur de contenu',
    initiale: 'M',
    color: 'bg-blue-100 text-blue-600',
    etoiles: 5,
    texte: "Le dashboard financier m'a donné une clarté que je n'avais jamais eue en 5 ans d'activité. Je vois en temps réel si je suis sur ma trajectoire. Le résumé hebdo IA est devenu mon rituel du lundi matin.",
    highlight: 'Clarté financière immédiate',
  },
  {
    nom: 'Amina B.',
    activite: 'E-commerçante mode',
    initiale: 'A',
    color: 'bg-emerald-100 text-emerald-600',
    etoiles: 5,
    texte: "Le CRM leads m'a changé la vie. J'avais des prospects qui traînaient depuis des mois sans relance. Maintenant les relances partent automatiquement et j'ai converti 3 clients en 2 semaines grâce aux alertes.",
    highlight: '3 clients convertis en 2 semaines',
  },
  {
    nom: 'Pierre-Louis G.',
    activite: 'Développeur freelance',
    initiale: 'P',
    color: 'bg-amber-100 text-amber-600',
    etoiles: 5,
    texte: "Pour 49€/mois j'ai l'équivalent d'un assistant administratif. La synchronisation avec Google Sheets fonctionne parfaitement — mes données restent là où je les veux.",
    highlight: 'ROI immédiat à 49€/mois',
  },
  {
    nom: 'Claire M.',
    activite: 'Coach business',
    initiale: 'C',
    color: 'bg-pink-100 text-pink-600',
    etoiles: 5,
    texte: "Ce qui m'a vendu VCEL c'est la configuration incluse. Pas besoin de tout paramétrer soi-même. En 24h j'avais un dashboard qui reflétait vraiment mon activité.",
    highlight: 'Opérationnel en 24h',
  },
  {
    nom: 'Thomas W.',
    activite: 'Agence communication',
    initiale: 'T',
    color: 'bg-cyan-100 text-cyan-600',
    etoiles: 5,
    texte: "Le score IA sur les leads est bluffant. Il identifie les prospects chauds mieux que moi parfois. On a arrêté de perdre du temps sur des leads froids.",
    highlight: 'Score IA des leads',
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 px-6 overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Témoignages</p>
          <h2 className="font-display text-3xl md:text-5xl font-normal text-[var(--navy)] mb-4">
            Ils ont repris le contrôle<br />
            <em className="not-italic text-[var(--text-muted)]">de leur activité</em>
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl mx-auto">
            Des solopreneurs et TPE qui ont transformé leur gestion quotidienne.
          </p>
        </div>

        {/* Grille témoignages */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <div key={i} className="break-inside-avoid bg-white rounded-2xl border border-[var(--border)] p-6 hover:border-cyan-200 hover:shadow-lg transition-all group">

              {/* Quote icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex">
                  {Array.from({ length: t.etoiles }).map((_, j) => (
                    <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <Quote size={20} className="text-[var(--border)] group-hover:text-cyan-200 transition-colors" />
              </div>

              {/* Highlight badge */}
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-100">
                <span className="text-cyan-600 text-xs font-semibold">{t.highlight}</span>
              </div>

              {/* Texte */}
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
                "{t.texte}"
              </p>

              {/* Auteur */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${t.color}`}>
                  {t.initiale}
                </div>
                <div>
                  <p className="text-[var(--text-primary)] text-sm font-semibold">{t.nom}</p>
                  <p className="text-[var(--text-muted)] text-xs">{t.activite}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note globale */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} size={18} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-semibold">4.9/5 · Note moyenne</p>
          <span className="text-[var(--border)]">·</span>
          <p className="text-[var(--text-muted)] text-sm">+50 utilisateurs actifs</p>
        </div>
      </div>
    </section>
  )
}