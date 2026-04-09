'use client'
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: "Qu'est-ce que VCEL, le logiciel de gestion pour solopreneurs ?",
    a: "VCEL est un logiciel SaaS tout-en-un conçu pour les solopreneurs et TPE/PME français. Il connecte votre CA, vos leads et vos factures dans un seul dashboard, avec un coach IA personnel qui connaît vos chiffres. La configuration est incluse — vous êtes opérationnel en 24h sans compétences techniques."
  },
  {
    q: "Faut-il des compétences techniques pour utiliser VCEL ?",
    a: "Non. La configuration complète est incluse dans l'abonnement. Vous accédez à votre dashboard depuis n'importe quel navigateur. Seule la connexion à vos outils Google (Sheets, Gmail) est nécessaire, et nous vous guidons étape par étape."
  },
  {
    q: "Combien de temps avant que le logiciel soit opérationnel ?",
    a: "24 à 48h en général. Après le paiement, vous recevez un email d'activation. Nous configurons votre espace et vous envoyons le lien d'accès une fois prêt. Certains clients sont opérationnels le jour même."
  },
  {
    q: "Comment VCEL synchronise-t-il avec Google Sheets ?",
    a: "VCEL se connecte à votre Google Sheets via OAuth sécurisé. Vos données CA, leads et factures sont synchronisées automatiquement en temps réel. Vos données restent dans vos propres Google Sheets — VCEL ne fait que les lire et les afficher."
  },
  {
    q: "Mes données sont-elles sécurisées avec VCEL ?",
    a: "Vos données sont stockées sur Supabase, hébergé en Europe, chiffré au repos et en transit. Vous restez propriétaire de vos données et pouvez en demander la suppression à tout moment. Nous ne revendons jamais vos données."
  },
  {
    q: "Puis-je résilier mon abonnement à tout moment ?",
    a: "Oui, sans engagement ni frais. Vous pouvez résilier depuis votre espace client en un clic ou en nous contactant. Votre accès est maintenu jusqu'à la fin de la période payée. Vos données Google Sheets vous appartiennent et restent accessibles."
  },
  {
    q: "Le coach IA remplace-t-il un expert-comptable ?",
    a: "Non. Le coach IA est un outil d'aide à la décision basé sur vos propres données business. Il vous aide à identifier des opportunités, suivre vos objectifs et prioriser vos actions. Pour des décisions financières importantes, consultez un expert-comptable."
  },
  {
    q: "Comment fonctionne la période d'essai gratuite ?",
    a: "Les plans Starter et Pro incluent 14 jours d'essai gratuits. Vous entrez votre carte bancaire lors de l'inscription, mais aucun débit n'est effectué pendant 14 jours. Vous pouvez résilier à tout moment avant la fin de l'essai sans frais. À l'issue des 14 jours, votre abonnement démarre automatiquement."
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-28 px-6">
      {/* Schema FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
          }))
        })}}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mb-14">
          <p className="text-blue-400 text-sm font-semibold mb-3 tracking-wide uppercase">FAQ</p>
          <h2 className="font-display text-4xl font-bold text-white">
            Questions fréquentes sur VCEL
          </h2>
          <p className="text-white/50 mt-3 text-sm">
            Logiciel de gestion pour solopreneurs et TPE/PME — toutes vos réponses
          </p>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                open === i
                  ? 'border-white/20 bg-white/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between p-5 gap-4">
                <h3 className={`text-sm font-medium leading-relaxed ${open === i ? 'text-white' : 'text-white/70'}`}>
                  {f.q}
                </h3>
                <div className="shrink-0 text-white/40">
                  {open === i ? <Minus size={14} /> : <Plus size={14} />}
                </div>
              </div>
              {open === i && (
                <div className="px-5 pb-5 text-white/70 text-sm leading-relaxed border-t border-white/10 pt-4">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}