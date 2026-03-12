'use client'
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: "Qu'est-ce que VCEL exactement ?",
    a: "VCEL est un outil SaaS qui connecte vos données business (CA, leads, factures) à un dashboard et un coach IA. Nous configurons les automatisations n8n pour vous — vous n'avez pas à le faire vous-même."
  },
  {
    q: "Faut-il des compétences techniques ?",
    a: "Non. La configuration est incluse dans l'abonnement. Vous accédez à votre dashboard via un navigateur. Seule la connexion à vos outils Google (Sheets, Gmail) est nécessaire."
  },
  {
    q: "Combien de temps avant que ça soit opérationnel ?",
    a: "24 à 48h en général. Après le paiement, vous recevez un email d'activation. On configure votre espace et on vous envoie le lien une fois prêt."
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos données financières restent dans votre propre Google Sheets. Notre base de données (Supabase) est hébergée en Europe, chiffrée au repos et en transit. Vous restez propriétaire de vos données."
  },
  {
    q: "Que se passe-t-il si je résilie ?",
    a: "Vous pouvez résilier à tout moment depuis votre espace client ou en nous contactant. Votre accès est maintenu jusqu'à la fin de la période payée. Vos données Google Sheets restent les vôtres."
  },
  {
    q: "Le coach IA donne des conseils financiers certifiés ?",
    a: "Non. Le coach IA est un outil d'aide à la décision basé sur vos propres données. Il ne remplace pas un expert-comptable ou un conseiller financier. Pour des décisions importantes, consultez un professionnel."
  },
  {
    q: "C'est quoi le code SOLO19 ?",
    a: "Un code promotionnel de lancement qui réduit votre premier mois de 49€ à 19€. Il s'applique directement sur la page de paiement Stripe. Sans engagement, vous pouvez annuler avant le deuxième mois."
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-14">
          <p className="text-blue-400 text-sm font-semibold mb-3 tracking-wide uppercase">FAQ</p>
          <h2 className="font-display text-4xl font-bold text-white">Questions fréquentes</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i}
              className={`border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                open === i ? 'border-white/15 bg-white/3' : 'border-white/6 hover:border-white/12'
              }`}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between p-5 gap-4">
                <span className={`text-sm font-medium leading-relaxed ${open === i ? 'text-white' : 'text-white/60'}`}>
                  {f.q}
                </span>
                <div className="shrink-0 text-white/30">
                  {open === i ? <Minus size={14} /> : <Plus size={14} />}
                </div>
              </div>
              {open === i && (
                <div className="px-5 pb-5 text-white/45 text-sm leading-relaxed border-t border-white/6 pt-4">
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
