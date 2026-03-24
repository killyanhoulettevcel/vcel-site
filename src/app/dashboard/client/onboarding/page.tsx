'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, ChevronRight, Zap, Users, FileText, Activity, User, ArrowRight, PartyPopper, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Step {
  id: string
  titre: string
  description: string
  valeur: string
  href: string
  cta: string
  icon: React.ElementType
  iconColor: string
  gradient: string
}

const steps: Step[] = [
  {
    id: 'profil',
    titre: 'Complétez votre profil',
    description: "Renseignez votre nom, secteur d'activité et logo.",
    valeur: 'Personnalise votre expérience et vos rapports automatiques.',
    href: '/dashboard/client/profil',
    cta: 'Compléter mon profil',
    icon: User,
    iconColor: 'text-blue-400',
    gradient: 'from-blue-500/10 to-transparent',
  },
  {
    id: 'ca',
    titre: 'Renseignez votre premier CA',
    description: "Ajoutez vos données financières pour voir vos graphiques s'animer.",
    valeur: "C'est le moment \"aha\" VCEL — votre tableau de bord prend vie instantanément.",
    href: '/dashboard/client/finances',
    cta: 'Saisir mon CA',
    icon: Activity,
    iconColor: 'text-orange-400',
    gradient: 'from-orange-500/10 to-transparent',
  },
  {
    id: 'lead',
    titre: 'Ajoutez votre premier lead',
    description: 'Testez votre CRM en ajoutant un prospect manuellement.',
    valeur: 'Suivez chaque opportunité de la prospection à la conversion.',
    href: '/dashboard/client/leads',
    cta: 'Aller au CRM',
    icon: Users,
    iconColor: 'text-purple-400',
    gradient: 'from-purple-500/10 to-transparent',
  },
  {
    id: 'facture',
    titre: 'Créez votre première facture',
    description: 'Générez une facture en 30 secondes, synchronisée avec Stripe.',
    valeur: 'Fini les tableaux Excel — tout est centralisé et relancé automatiquement.',
    href: '/dashboard/client/factures',
    cta: 'Créer une facture',
    icon: FileText,
    iconColor: 'text-green-400',
    gradient: 'from-green-500/10 to-transparent',
  },
  {
    id: 'workflow',
    titre: 'Activez vos automatisations',
    description: "Vos 8 workflows n8n sont préconfigurés et prêts à l'emploi.",
    valeur: 'Relances auto, résumé hebdo IA, sync données — tout tourne sans vous.',
    href: '/dashboard/client/workflows',
    cta: 'Voir les workflows',
    icon: Zap,
    iconColor: 'text-yellow-400',
    gradient: 'from-yellow-500/10 to-transparent',
  },
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const nom = session?.user?.name?.split(' ')[0] || 'vous'

  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<string | null>(null)

  useEffect(() => {
    const userId = (session?.user as any)?.id
    if (!userId) return

    const detect = async () => {
      const auto = new Set<string>()
      try {
        const profil = await fetch('/api/profil').then(r => r.ok ? r.json() : null)
        if (profil?.nom || profil?.secteur) auto.add('profil')

        const ca = await fetch('/api/ca').then(r => r.ok ? r.json() : [])
        if (Array.isArray(ca) && ca.length > 0) auto.add('ca')

        const leads = await fetch('/api/leads').then(r => r.ok ? r.json() : [])
        if (Array.isArray(leads) && leads.length > 0) auto.add('lead')

        const factures = await fetch('/api/factures').then(r => r.ok ? r.json() : [])
        if (Array.isArray(factures) && factures.length > 0) auto.add('facture')

        const workflows = await fetch('/api/workflows').then(r => r.ok ? r.json() : [])
        if (Array.isArray(workflows) && workflows.some((w: any) => w.statut === 'ok')) auto.add('workflow')
      } catch {}

      const saved = localStorage.getItem(`onboarding_${userId}`)
      const manual = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>()
      const merged = new Set([...auto, ...manual])

      setCompleted(merged)
      localStorage.setItem(`onboarding_${userId}`, JSON.stringify([...merged]))
      setLoading(false)
    }

    detect()
  }, [session])

  const markDone = (id: string) => {
    const userId = (session?.user as any)?.id
    const next = new Set(completed)
    next.add(id)
    setCompleted(next)
    localStorage.setItem(`onboarding_${userId}`, JSON.stringify([...next]))
  }

  const progress = Math.round(completed.size / steps.length * 100)
  const done = completed.size === steps.length
  const nextStep = steps.find(s => !completed.has(s.id))

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-white/30">
        <div className="w-5 h-5 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
        Vérification de votre progression...
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-cyan-400" />
          <span className="text-xs text-cyan-400 font-medium uppercase tracking-widest">Démarrage</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          Bienvenue {nom} 👋
        </h1>
        <p className="text-white/40 text-sm">
          Suivez ces {steps.length} étapes pour découvrir toute la valeur de VCEL.
          Votre progression est détectée automatiquement.
        </p>
        <button
          onClick={() => router.push('/dashboard/client')}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          ← Retour au dashboard
        </button>
      </div>

      {/* Progress card */}
      <div className="card-glass p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white text-sm font-semibold mb-0.5">Votre progression</p>
            <p className="text-white/30 text-xs">
              {completed.size === 0
                ? 'Commencez par la première étape ci-dessous'
                : done
                ? 'Configuration terminée — vous êtes prêt ✓'
                : `${steps.length - completed.size} étape${steps.length - completed.size > 1 ? 's' : ''} restante${steps.length - completed.size > 1 ? 's' : ''}`}
            </p>
          </div>
          <span className="font-display text-3xl font-bold text-white">{progress}%</span>
        </div>

        <div className="flex gap-1.5">
          {steps.map((step) => (
            <div key={step.id} className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  completed.has(step.id) ? 'w-full bg-gradient-to-r from-cyan-500 to-blue-500' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {nextStep && !done && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronRight size={14} className="text-cyan-400" />
              <p className="text-white/50 text-xs">Prochaine étape :</p>
              <p className="text-white text-xs font-medium">{nextStep.titre}</p>
            </div>
            <a href={nextStep.href} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Y aller →
            </a>
          </div>
        )}
      </div>

      {done && (
        <div className="card-glass p-6 mb-6 border border-green-500/20 bg-green-500/5 text-center">
          <PartyPopper size={32} className="text-green-400 mx-auto mb-3" />
          <h2 className="font-display font-bold text-white text-lg mb-1">Configuration terminée ! 🎉</h2>
          <p className="text-white/40 text-sm mb-4">
            Vous avez découvert toutes les fonctionnalités. Votre business est maintenant automatisé.
          </p>
          <button
            onClick={() => router.push('/dashboard/client')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Voir mon dashboard <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, i) => {
          const isCompleted = completed.has(step.id)
          const isActive = activeStep === step.id

          return (
            <div
              key={step.id}
              className={`card-glass overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-60' : ''} ${isActive ? 'bg-gradient-to-r ' + step.gradient : ''}`}
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => setActiveStep(isActive ? null : step.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle size={22} className="text-green-400" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white/30">
                        {i + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <step.icon size={13} className={isCompleted ? 'text-white/20' : step.iconColor} />
                      <p className={`text-sm font-semibold ${isCompleted ? 'line-through text-white/30' : 'text-white'}`}>
                        {step.titre}
                      </p>
                    </div>
                    <p className="text-white/35 text-xs mt-0.5">{step.description}</p>
                  </div>

                  <div className="shrink-0">
                    {isCompleted ? (
                      <span className="text-xs text-green-400 font-medium">✓ Fait</span>
                    ) : (
                      <ChevronRight size={16} className={`text-white/20 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    )}
                  </div>
                </div>
              </div>

              {isActive && !isCompleted && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="bg-white/5 rounded-xl p-3 mb-4 ml-10">
                    <p className="text-xs text-white/50 flex items-start gap-2">
                      <Sparkles size={11} className="text-cyan-400 mt-0.5 shrink-0" />
                      <span><span className="text-cyan-400 font-medium">Pourquoi ça compte : </span>{step.valeur}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-10">
                    <a
                      href={step.href}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#0D1B2A] text-xs font-bold rounded-lg hover:bg-white/90 transition-colors"
                    >
                      {step.cta} <ArrowRight size={11} />
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); markDone(step.id) }}
                      className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                      <CheckCircle size={13} />
                      Marquer comme fait
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card-glass p-5 mt-6 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium mb-0.5">Besoin d'aide ?</p>
          <p className="text-white/30 text-xs">Notre équipe répond en moins de 2h</p>
        </div>
        <a
          href="mailto:support@votrecommerceenligne.fr"
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-white/20"
        >
          Contacter le support
        </a>
      </div>
    </div>
  )
}