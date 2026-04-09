// src/lib/usePlan.ts
import { useSession } from 'next-auth/react'

export type Plan = 'starter' | 'pro' | 'business' | null

export const PLAN_FEATURES: Record<string, string[]> = {
  starter:  ['dashboard', 'factures', 'devis', 'avoirs', 'acomptes', 'simulateur', 'leads', 'agenda', 'finances', 'produits', 'rentabilite', 'alertes', 'score', 'onboarding', 'import', 'parametres', 'profil'],
  pro:      ['*'], // tout
  business: ['*'], // tout
}

// Features bloquées par plan
export const PLAN_GATES: Record<string, Plan> = {
  coach:      'pro',
  workflows:  'pro',
  objectifs:  'pro',
  connecteurs: 'pro',
  prix:       'pro',
}

export function usePlan() {
  const { data: session } = useSession()
  const plan = ((session?.user as any)?.plan ?? 'starter') as Plan

  const canAccess = (feature: string): boolean => {
    if (!plan) return false
    if (plan === 'pro' || plan === 'business') return true
    const required = PLAN_GATES[feature]
    if (!required) return true // pas de gate = accessible à tous
    return false
  }

  return { plan, canAccess }
}