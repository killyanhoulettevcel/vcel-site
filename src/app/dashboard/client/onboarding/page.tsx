'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Circle, ChevronRight, Zap, Users, FileText, Activity, User, ExternalLink, PartyPopper } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Step {
  id: string
  titre: string
  description: string
  href?: string
  cta: string
  icon: React.ElementType
  iconColor: string
}

const steps: Step[] = [
  {
    id: 'profil',
    titre: 'Complétez votre profil',
    description: 'Ajoutez votre nom, secteur d\'activité et personnalisez votre compte.',
    href: '/dashboard/client/profil',
    cta: 'Compléter mon profil',
    icon: User,
    iconColor: 'text-blue-400',
  },
  {
    id: 'lead',
    titre: 'Ajoutez votre premier lead',
    description: 'Testez votre CRM en ajoutant un prospect manuellement.',
    href: '/dashboard/client/leads',
    cta: 'Aller au CRM',
    icon: Users,
    iconColor: 'text-purple-400',
  },
  {
    id: 'facture',
    titre: 'Créez votre première facture',
    description: 'Essayez la gestion de factures — synchronisée avec Stripe.',
    href: '/dashboard/client/factures',
    cta: 'Créer une facture',
    icon: FileText,
    iconColor: 'text-green-400',
  },
  {
    id: 'ca',
    titre: 'Renseignez votre CA',
    description: 'Ajoutez vos données financières pour voir vos graphiques en temps réel.',
    href: '/dashboard/client/finances',
    cta: 'Renseigner le CA',
    icon: Activity,
    iconColor: 'text-orange-400',
  },
  {
    id: 'workflow',
    titre: 'Activez vos workflows',
    description: 'Découvrez vos 8 automatisations n8n prêtes à l\'emploi.',
    href: '/dashboard/client/workflows',
    cta: 'Voir les workflows',
    icon: Zap,
    iconColor: 'text-yellow-400',
  },
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const nom = session?.user?.name?.split(' ')[0] || 'vous'

  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading]     = useState(true)

  // Charger l'état depuis localStorage
  useEffect(() => {
    const userId = (session?.user as any)?.id
    if (!userId) return
    const saved = localStorage.getItem(`onboarding_${userId}`)
    if (saved) setCompleted(new Set(JSON.parse(saved)))
    setLoading(false)
  }, [session])

  const toggle = (id: string) => {
    const userId = (session?.user as any)?.id
    const next   = new Set(completed)
    next.has(id) ? next.delete(id) : next.add(id)
    setCompleted(next)
    localStorage.setItem(`onboarding_${userId}`, JSON.stringify([...next]))
  }

  const progress = Math.round(completed.size / steps.length * 100)
  const done     = completed.size === steps.length

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Bienvenue {nom} 👋
        </h1>
        <p className="text-white/40 text-sm">Suivez ces étapes pour bien démarrer avec VCEL</p>
      </div>

      {/* Progress */}
      <div className="card-glass p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-medium">Progression</p>
          <p className="text-white font-display font-bold">{completed.size}/{steps.length}</p>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/30 text-xs mt-2">{progress}% complété</p>
      </div>

      {/* Félicitations */}
      {done && (
        <div className="card-glass p-6 mb-6 border-green-500/20 bg-green-500/5 text-center">
          <PartyPopper size={32} className="text-green-400 mx-auto mb-3" />
          <h2 className="font-display font-bold text-white text-lg mb-1">Configuration terminée ! 🎉</h2>
          <p className="text-white/40 text-sm">Vous êtes prêt à automatiser votre business.</p>
          <a href="/dashboard/client" className="btn-primary mt-4 inline-flex">
            Voir mon dashboard <ChevronRight size={14} />
          </a>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const isCompleted = completed.has(step.id)
          return (
            <div key={step.id}
              className={`card-glass p-5 transition-all ${isCompleted ? 'opacity-60' : 'hover:border-white/10'}`}>
              <div className="flex items-start gap-4">
                {/* Numéro / Check */}
                <button onClick={() => toggle(step.id)}
                  className="shrink-0 mt-0.5 transition-transform hover:scale-110">
                  {isCompleted
                    ? <CheckCircle size={22} className="text-green-400" />
                    : <Circle size={22} className="text-white/20 hover:text-white/40" />
                  }
                </button>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon size={14} className={step.iconColor} />
                    <p className={`text-sm font-medium ${isCompleted ? 'line-through text-white/40' : 'text-white'}`}>
                      {step.titre}
                    </p>
                    <span className="text-xs text-white/20 ml-auto">Étape {i + 1}</span>
                  </div>
                  <p className="text-white/40 text-xs mb-3">{step.description}</p>
                  {!isCompleted && step.href && (
                    <a href={step.href}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      {step.cta} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Support */}
      <div className="card-glass p-5 mt-6 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium mb-0.5">Besoin d'aide ?</p>
          <p className="text-white/30 text-xs">Notre équipe répond en moins de 2h</p>
        </div>
        <a href="mailto:support@votrecommerceenligne.fr"
          className="btn-ghost text-sm py-2 px-4">
          Contacter le support
        </a>
      </div>
    </div>
  )
}
