// ─── Utilisateurs ────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'client'

export interface VCELUser {
  id: string
  email: string
  nom: string
  role: UserRole
  secteur?: string
  categorie?: string
  stripe_customer_id?: string
  date_inscription: string
  statut: 'actif' | 'inactif' | 'suspendu'
  workflows_actifs: string[]
}

// ─── Finance ─────────────────────────────────────────────────────────────────
export interface FactureClient {
  id: string
  user_id: string
  numero_facture: string
  date_facture: string
  montant_ht: number
  tva: number
  montant_ttc: number
  statut: 'payée' | 'en attente' | 'en retard'
  stripe_invoice_id?: string
}

export interface CAData {
  mois: string          // "2026-03"
  label: string         // "Mars 2026"
  ca_ht: number
  charges: number
  marge: number
  nb_factures: number
}

// ─── CRM ─────────────────────────────────────────────────────────────────────
export interface Lead {
  id: string
  user_id: string
  date: string
  nom: string
  email: string
  telephone?: string
  entreprise?: string
  secteur?: string
  message?: string
  score: 'chaud' | 'tiède' | 'froid'
  statut: 'nouveau' | 'contacté' | 'qualifié' | 'converti' | 'perdu'
  source: string
}

// ─── Workflows ───────────────────────────────────────────────────────────────
export interface WorkflowStatus {
  id: string
  user_id: string
  workflow_id: string
  nom: string
  actif: boolean
  derniere_execution?: string
  nb_executions_mois: number
  statut: 'ok' | 'erreur' | 'inactif'
  erreur_message?: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardData {
  user: VCELUser
  ca_mois_actuel: number
  ca_mois_precedent: number
  nb_leads_mois: number
  nb_factures_impayees: number
  workflows_actifs: number
  ca_historique: CAData[]
  derniers_leads: Lead[]
  dernieres_factures: FactureClient[]
  workflows: WorkflowStatus[]
}
