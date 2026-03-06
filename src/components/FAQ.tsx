'use client'
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: "Je n'ai pas n8n, comment ça marche ?",
    a: "Vous n'avez pas besoin de l'installer vous-même. On vous envoie un guide pour déployer n8n en 10 min sur Railway (gratuit jusqu'à 500 exécutions/mois) ou n8n Cloud. Les JSON se collent directement dans l'interface."
  },
  {
    q: "C'est quoi la réforme PDP 2026 ?",
    a: "À partir de septembre 2026, toutes les factures B2B en France devront passer par une Plateforme de Dématérialisation Partenaire. Notre workflow Devis/Factures est déjà conforme et vous évite une amende de 15€ par facture non conforme."
  },
  {
    q: "Faut-il des compétences techniques ?",
    a: "Non. Chaque workflow est livré avec une vidéo setup de 2 minutes. Vous collez le JSON dans n8n, entrez vos credentials (Google, Stripe, Gmail) et c'est actif. Aucune ligne de code à écrire."
  },
  {
    q: "Et si un workflow ne fonctionne pas chez moi ?",
    a: "On répond sous 48h par email. Si après 7 jours un workflow du pack ne tourne pas dans votre environnement, on vous rembourse intégralement."
  },
  {
    q: "Puis-je modifier les workflows à ma sauce ?",
    a: "Oui, 100%. Les JSON sont open, vous les adaptez librement dans n8n. On livre une base solide, vous customisez selon vos besoins."
  },
  {
    q: "Qu'est-ce que le code SOLO19 ?",
    a: "C'est un code de lancement qui réduit votre premier mois de 49€ à 19€. Applicable directement au checkout Stripe. Sans engagement, vous annulez quand vous voulez."
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-28 px-6 overflow-hidden">
      <div className="glow-orb w-[400px] h-[400px] bg-indigo-600/10 bottom-0 right-[-100px]" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <div className="section-label">
            <span className="w-4 h-px bg-blue-400" />
            Questions fréquentes
            <span className="w-4 h-px bg-blue-400" />
          </div>
          <h2 className="font-display text-4xl font-bold text-white">
            Tout ce que vous voulez savoir
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i}
              className={`card-glass overflow-hidden transition-all duration-300 cursor-pointer ${
                open === i ? 'border-blue-500/30' : 'hover:border-white/10'
              }`}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between p-5 gap-4">
                <span className={`font-medium text-sm ${open === i ? 'text-white' : 'text-white/70'}`}>
                  {f.q}
                </span>
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  open === i ? 'bg-blue-500 border-blue-500' : 'border-white/10'
                }`}>
                  {open === i
                    ? <Minus size={12} className="text-white" />
                    : <Plus size={12} className="text-white/40" />
                  }
                </div>
              </div>
              {open === i && (
                <div className="px-5 pb-5 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-4">
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
