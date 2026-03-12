'use client'
import ImportCSV from '@/components/ImportCSV'
import { FileText, BarChart2, Users, Truck } from 'lucide-react'

const types = [
  {
    icon: BarChart2,
    label: 'CA & Finances',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    cols: ['mois', 'ca_ht', 'charges_total', 'marge_brute', 'nb_factures'],
    exemple: 'Jan 2026, 4600, 1200, 3400, 3',
  },
  {
    icon: Users,
    label: 'CRM Leads',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    cols: ['date', 'nom', 'email', 'telephone', 'entreprise', 'secteur', 'score', 'statut', 'source'],
    exemple: '2026-01-15, Sophie Renard, sophie@ex.fr, 06..., Renard SAS, Conseil, chaud, nouveau, LinkedIn',
  },
  {
    icon: FileText,
    label: 'Factures clients',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    cols: ['invoice_id', 'invoice_number', 'client_email', 'montant_ht', 'montant_ttc', 'date', 'statut'],
    exemple: 'inv_xxx, F-2026-001, client@ex.fr, 1000, 1200, 2026-01-15, payée',
  },
  {
    icon: Truck,
    label: 'Factures fournisseurs',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    cols: ['date_reception', 'fournisseur', 'numero_facture', 'montant_ht', 'tva', 'montant_ttc', 'statut'],
    exemple: '2026-01-10, Adobe, INV-001, 50, 10, 60, reçue',
  },
]

export default function ImportPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">Importer des données</h1>
        <p className="text-white/40 text-sm">Glissez n'importe quel CSV — le type est détecté automatiquement et les données sont synchronisées dans Supabase et votre Google Sheet</p>
      </div>

      {/* Zone d'import principale */}
      <div className="mb-10">
        <ImportCSV />
      </div>

      {/* Guide des formats */}
      <h2 className="font-display font-semibold text-white text-sm mb-4">Formats acceptés</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        {types.map((t) => (
          <div key={t.label} className={`card-glass p-5 border ${t.bg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.bg}`}>
                <t.icon size={16} className={t.color} />
              </div>
              <h3 className="font-medium text-white text-sm">{t.label}</h3>
            </div>

            {/* Colonnes */}
            <div className="mb-3">
              <p className="text-white/30 text-xs uppercase tracking-wider font-semibold mb-2">Colonnes attendues</p>
              <div className="flex flex-wrap gap-1.5">
                {t.cols.map(col => (
                  <span key={col} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/50 font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Exemple */}
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider font-semibold mb-2">Exemple de ligne</p>
              <p className="text-white/30 text-xs font-mono bg-white/3 rounded-lg p-2 break-all">{t.exemple}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="card-glass p-5 mt-6 border border-blue-500/10 bg-blue-500/3">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">💡 Conseils</p>
        <ul className="space-y-1.5 text-white/30 text-xs">
          <li>• La première ligne doit contenir les noms de colonnes exactement comme indiqué</li>
          <li>• Les colonnes supplémentaires sont ignorées automatiquement</li>
          <li>• Les données sont insérées dans Supabase ET dans votre Google Sheet simultanément</li>
          <li>• En cas de doublon (même mois pour le CA, même email pour les leads), la ligne existante est mise à jour</li>
        </ul>
      </div>
    </div>
  )
}
