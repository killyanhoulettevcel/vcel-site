'use client'
// src/components/dashboard/PlanGate.tsx
import { Zap, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { usePlan, Plan } from '@/lib/usePlan'

const PLAN_LABELS: Record<string, string> = {
  starter:  'Starter',
  pro:      'Pro',
  business: 'Business',
}

const PLAN_PRICES: Record<string, string> = {
  pro:      '39€/mois',
  business: '69€/mois',
}

const FEATURE_LABELS: Record<string, { title: string; description: string; features: string[] }> = {
  coach: {
    title: 'Coach IA Business',
    description: 'Votre coach personnel qui connaît vos chiffres et vous donne des conseils actionnables chaque semaine.',
    features: ['Analyse de vos KPIs en temps réel', 'Conseils personnalisés basés sur vos données', 'Résumé hebdomadaire intelligent', 'Détection des opportunités de croissance'],
  },
  workflows: {
    title: 'Automatisations & Workflows',
    description: 'Automatisez vos tâches répétitives et connectez VCEL à vos outils Google.',
    features: ['Synchronisation Google Sheets', 'Workflows automatiques sur mesure', 'Déclencheurs et actions personnalisés', 'Logs et monitoring des exécutions'],
  },
  objectifs: {
    title: 'Objectifs & Suivi',
    description: 'Définissez vos objectifs business et suivez votre progression en temps réel.',
    features: ['Objectifs CA, leads, factures', 'Suivi de progression visuel', 'Alertes si vous déviez de vos cibles', 'Historique et comparaisons'],
  },
  prix: {
    title: 'Suggestions de Prix IA',
    description: 'L\'IA analyse votre marché et vos données pour vous suggérer les meilleurs tarifs.',
    features: ['Analyse concurrentielle automatique', 'Suggestions basées sur vos données', 'Simulation d\'impact tarifaire', 'Historique des évolutions'],
  },
  connecteurs: {
    title: 'Connecteurs & Intégrations',
    description: 'Connectez VCEL à tous vos outils : Google Sheets, Gmail, Calendar et plus.',
    features: ['Connexion Google Sheets', 'Synchronisation Gmail', 'Intégration Google Calendar', 'APIs tierces'],
  },
}

interface PlanGateProps {
  feature: string
  requiredPlan?: Plan
  children: React.ReactNode
}

export default function PlanGate({ feature, requiredPlan = 'pro', children }: PlanGateProps) {
  const { canAccess, plan } = usePlan()

  if (canAccess(feature)) return <>{children}</>

  const info = FEATURE_LABELS[feature] || {
    title: 'Fonctionnalité Pro',
    description: 'Cette fonctionnalité est disponible à partir du plan Pro.',
    features: [],
  }

  const targetPlan = requiredPlan || 'pro'
  const billingParam = 'monthly'

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-md w-full">

        {/* Icône */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #0D1B2A, #1e3a5f)', border: '1px solid rgba(79,195,247,0.2)' }}>
          <Lock size={28} style={{ color: '#4FC3F7' }} />
        </div>

        {/* Titre */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
            style={{ background: 'rgba(79,195,247,0.1)', color: '#0288D1', border: '1px solid rgba(79,195,247,0.2)' }}>
            <Zap size={11} />
            Disponible en plan {PLAN_LABELS[targetPlan]}
          </div>
          <h2 className="font-display text-2xl mb-2" style={{ color: '#0D1B2A' }}>{info.title}</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#7A90A4' }}>{info.description}</p>
        </div>

        {/* Features incluses */}
        {info.features.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid rgba(13,27,42,0.08)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#A8BDD0' }}>
              Ce que vous débloquez
            </p>
            <div className="space-y-2">
              {info.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)' }}>
                    <Sparkles size={8} style={{ color: '#0288D1' }} />
                  </div>
                  <span style={{ color: '#3D5166' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan actuel + CTA */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #0D1B2A, #1e3a5f)', border: '1px solid rgba(79,195,247,0.15)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Votre plan actuel</p>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {PLAN_LABELS[plan || 'starter']}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Plan {PLAN_LABELS[targetPlan]}</p>
              <p className="text-sm font-bold" style={{ color: '#4FC3F7' }}>{PLAN_PRICES[targetPlan]}</p>
            </div>
          </div>

          <a
            href={`/checkout?plan=${targetPlan}&billing=${billingParam}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #4FC3F7, #0288D1)', color: '#ffffff' }}
          >
            <Zap size={14} />
            Passer au plan {PLAN_LABELS[targetPlan]}
            <ArrowRight size={13} />
          </a>

          <p className="text-center text-xs mt-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            14 jours gratuits · résiliable avant le premier débit
          </p>
        </div>
      </div>
    </div>
  )
}