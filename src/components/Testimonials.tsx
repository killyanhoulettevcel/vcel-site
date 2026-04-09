'use client'
import { useEffect, useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    nom: 'Sophie R.',
    activite: 'Consultante RH indépendante',
    initiale: 'S',
    color: 'bg-purple-100 text-purple-700',
    etoiles: 5,
    texte: "Avant VCEL je passais 3h par semaine à mettre à jour mes tableaux. Maintenant tout est automatique. Le coach IA m'a aidé à identifier que mes relances factures trop tardives me coûtaient en moyenne 800€/mois.",
    highlight: '3h/semaine économisées',
    highlightColor: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    nom: 'Amina B.',
    activite: 'E-commerçante mode',
    initiale: 'A',
    color: 'bg-emerald-100 text-emerald-700',
    etoiles: 5,
    texte: "Le CRM leads m'a changé la vie. J'avais des prospects qui traînaient depuis des mois sans relance. Maintenant les relances partent automatiquement et j'ai converti 3 clients en 2 semaines grâce aux alertes.",
    highlight: '3 clients convertis en 2 semaines',
    highlightColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    nom: 'Claire M.',
    activite: 'Coach business',
    initiale: 'C',
    color: 'bg-pink-100 text-pink-700',
    etoiles: 5,
    texte: "Ce qui m'a vendu VCEL c'est la configuration incluse. Pas besoin de tout paramétrer soi-même. En 24h j'avais un dashboard qui reflétait vraiment mon activité.",
    highlight: 'Opérationnel en 24h',
    highlightColor: 'bg-pink-50 border-pink-200 text-pink-700',
  },
  {
    nom: 'Marc T.',
    activite: 'Formateur & créateur de contenu',
    initiale: 'M',
    color: 'bg-blue-100 text-blue-700',
    etoiles: 5,
    texte: "Le dashboard financier m'a donné une clarté que je n'avais jamais eue en 5 ans d'activité. Je vois en temps réel si je suis sur ma trajectoire. Le résumé hebdo IA est devenu mon rituel du lundi matin.",
    highlight: 'Clarté financière immédiate',
    highlightColor: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    nom: 'Pierre-Louis G.',
    activite: 'Développeur freelance',
    initiale: 'P',
    color: 'bg-amber-100 text-amber-700',
    etoiles: 5,
    texte: "Pour 39€/mois j'ai l'équivalent d'un assistant administratif. La synchronisation avec Google Sheets fonctionne parfaitement — mes données restent là où je les veux.",
    highlight: 'ROI immédiat à 39€/mois',
    highlightColor: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    nom: 'Thomas W.',
    activite: 'Agence communication',
    initiale: 'T',
    color: 'bg-cyan-100 text-cyan-700',
    etoiles: 5,
    texte: "Le score IA sur les leads est bluffant. Il identifie les prospects chauds mieux que moi parfois. On a arrêté de perdre du temps sur des leads froids.",
    highlight: 'Score IA des leads',
    highlightColor: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  },
]

export default function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const speed = 0.5 // px par frame
    const totalWidth = track.scrollWidth / 3 // triplé donc /3

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += speed
        if (posRef.current >= totalWidth) posRef.current = 0
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <section className="py-20 md:py-28 overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>

      {/* Header */}
      <div className="text-center mb-14 px-6">
        <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Témoignages</p>
        <h2 className="font-display text-3xl md:text-5xl font-normal text-[var(--navy)] mb-4">
          Ils ont repris le contrôle<br />
          <em className="not-italic" style={{ color: '#7A90A4' }}>de leur activité</em>
        </h2>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
          <span className="text-[var(--text-secondary)] text-sm font-semibold">4.9/5</span>
          <span className="text-[var(--border)]">·</span>
          <span className="text-[var(--text-muted)] text-sm">+50 utilisateurs actifs</span>
        </div>
      </div>

      {/* Carrousel infini */}
      <div className="relative">
        {/* Dégradés masque gauche/droite */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #F5F4F0, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(-90deg, #F5F4F0, transparent)' }} />

        {/* Track — dupliqué pour effet infini */}
        <div ref={trackRef} className="flex gap-5 will-change-transform" style={{ width: 'max-content' }}>
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              onMouseEnter={() => { pausedRef.current = true }}
              onMouseLeave={() => { pausedRef.current = false }}
              className="w-80 shrink-0 bg-white rounded-2xl border border-[var(--border)] p-6 cursor-default select-none
                transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:border-cyan-200"
              style={{ boxShadow: '0 2px 12px rgba(13,27,42,0.06)' }}
            >
              {/* Header card */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex">
                  {Array.from({ length: t.etoiles }).map((_, j) => (
                    <Star key={j} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <Quote size={18} style={{ color: 'rgba(13,27,42,0.08)' }} />
              </div>

              {/* Badge highlight */}
              <span className={`inline-flex items-center mb-3 px-2.5 py-1 rounded-lg border text-xs font-semibold ${t.highlightColor}`}>
                {t.highlight}
              </span>

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
      </div>
    </section>
  )
}