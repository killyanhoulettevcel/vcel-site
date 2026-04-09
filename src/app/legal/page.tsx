'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const tabs = [
  { id: 'mentions',        label: 'Mentions légales' },
  { id: 'cgv',             label: 'CGV' },
  { id: 'cgu',             label: 'CGU' },
  { id: 'confidentialite', label: 'Confidentialité' },
]

function Mentions() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>Éditeur du site</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          KILLYAN HOULETTE<br />
          Entrepreneur individuel<br />
          Adresse : Trets, France<br />
          SIRET : 948 881 297 00014<br />
          Email : <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>Directeur de la publication</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>Killyan Houlette</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>Hébergement</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a href="https://vercel.com" target="_blank" className="text-cyan-600 hover:underline">vercel.com</a>
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>Propriété intellectuelle</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          L'ensemble du contenu de ce site (textes, images, logotypes, code source) est la propriété exclusive
          de Killyan Houlette, sauf mention contraire. Toute reproduction, distribution ou utilisation sans
          autorisation préalable écrite est interdite.
        </p>
      </section>
    </div>
  )
}

function CGV() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>1. Identification du vendeur</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          KILLYAN HOULETTE, entrepreneur individuel, SIRET 948 881 297 00014, domicilié à Trets, France.
          Email : <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>2. Objet</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Les présentes CGV régissent la vente du service SaaS VCEL, un outil d'automatisation de gestion
          pour solopreneurs et PME, accessible via abonnement mensuel ou annuel.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>3. Prix et facturation</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Les tarifs des abonnements VCEL sont les suivants :
          - Plan Starter : 19€ TTC/mois (ou 15€ TTC/mois en formule annuelle, facturé 180€/an)
          - Plan Pro : 39€ TTC/mois (ou 31€ TTC/mois en formule annuelle, facturé 372€/an)
          - Plan Business : 69€ TTC/mois (ou 55€ TTC/mois en formule annuelle, facturé 660€/an)
          Les plans Starter et Pro bénéficient d'une période d'essai gratuite de 14 jours. Aucun débit n'est effectué pendant cette période.
          Les prix sont indiqués en euros toutes taxes comprises. La facturation est effectuée via Stripe à la date
          de souscription, puis chaque mois ou chaque année selon la formule choisie.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>4. Droit de rétractation</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation{' '}
          <strong>ne s'applique pas</strong> aux contenus numériques fournis immédiatement après paiement,
          dès lors que le consommateur a expressément renoncé à son droit de rétractation avant le début
          de l'exécution. Cette renonciation est recueillie lors du paiement.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>5. Résiliation et suppression des données</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          L'abonnement mensuel est sans engagement. La résiliation prend effet à la fin de la période payée en cours.
          À l'issue de cette période, <strong>l'ensemble des données de l'utilisateur stockées sur l'infrastructure
          VCEL sont définitivement supprimées</strong>. Aucune exportation n'est garantie après résiliation —
          il appartient à l'utilisateur d'exporter ses données avant la fin de son abonnement.
          Pour la formule annuelle, aucun remboursement partiel n'est prévu sauf manquement grave de notre part.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>6. Disponibilité du service</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          VCEL s'engage à maintenir une disponibilité du service de 99% par mois hors maintenance planifiée.
          En cas d'indisponibilité prolongée imputable à VCEL, un avoir proportionnel pourra être accordé sur demande.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>7. Responsabilité</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          VCEL est un outil d'aide à la gestion et ne constitue pas un conseil financier, juridique ou comptable certifié.
          Killyan Houlette ne saurait être tenu responsable des décisions prises sur la base des informations affichées.
          Pour toute décision importante, consultez un professionnel qualifié.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>8. Droit applicable et médiation</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
          en priorité via <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>.
          Vous pouvez également recourir gratuitement à un médiateur de la consommation conformément à l'article L612-1
          du Code de la consommation. À défaut, les tribunaux d'Aix-en-Provence seront compétents.
        </p>
      </section>
    </div>
  )
}

function CGU() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>1. Acceptation</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          L'utilisation du service VCEL implique l'acceptation pleine et entière des présentes CGU.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>2. Description du service</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          VCEL est une plateforme SaaS d'automatisation de gestion incluant un dashboard financier, un CRM leads,
          un coach IA, la gestion des factures, et des automatisations n8n préconfigurées.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>3. Compte utilisateur</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Vous êtes responsable de la confidentialité de vos identifiants. Toute activité effectuée depuis votre
          compte est sous votre responsabilité. En cas de compromission, contactez immédiatement{' '}
          <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>4. Utilisation autorisée</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Le service est réservé à un usage professionnel licite. Il est interdit d'utiliser VCEL pour des activités
          illégales, d'accéder aux données d'autres utilisateurs, de procéder à du reverse engineering ou de revendre
          l'accès à des tiers sans autorisation écrite.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>5. Données et infrastructure</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Les données métier (CA, leads, factures, etc.) sont stockées sur l'infrastructure VCEL (Google Sheets
          opéré par VCEL et base de données Supabase). <strong>L'utilisateur n'est pas propriétaire de l'infrastructure
          de stockage.</strong> À la résiliation, toutes les données sont supprimées définitivement à la fin de la
          période payée. Il appartient à l'utilisateur d'exporter ses données avant la fin de son abonnement.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>6. Modifications et résiliation</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          VCEL se réserve le droit de modifier le service avec préavis raisonnable. Les évolutions tarifaires
          feront l'objet d'une notification par email 30 jours avant. VCEL peut suspendre un compte en cas de
          violation des CGU, non-paiement ou usage abusif.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>7. Droit applicable</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des tribunaux d'Aix-en-Provence.
        </p>
      </section>
    </div>
  )
}

function Confidentialite() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>1. Responsable du traitement</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          KILLYAN HOULETTE, entrepreneur individuel, SIRET 948 881 297 00014, Trets, France.<br />
          Email : <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>2. Données collectées</h2>
        <ul className="space-y-2 text-sm" style={{ color: '#3D5166' }}>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Identification : nom, email</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Paiement : traité exclusivement par Stripe (aucune donnée bancaire stockée par VCEL)</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Données d'usage : logs de connexion, actions dans le dashboard</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Données métier : CA, leads, factures — stockées sur l'infrastructure VCEL (Google Sheets opéré par VCEL + Supabase)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>3. Finalités</h2>
        <ul className="space-y-2 text-sm" style={{ color: '#3D5166' }}>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Création et gestion du compte</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Fourniture du service VCEL</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Envoi des résumés hebdomadaires et notifications</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Traitement des paiements via Stripe</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> Amélioration du service</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>4. Base légale</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Exécution du contrat d'abonnement (art. 6.1.b RGPD) et intérêt légitime à améliorer le service (art. 6.1.f RGPD).
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>5. Sous-traitants</h2>
        <ul className="space-y-2 text-sm" style={{ color: '#3D5166' }}>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> <strong>Supabase</strong> — base de données (infrastructure EU)</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> <strong>Stripe</strong> — paiement sécurisé</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> <strong>Vercel</strong> — hébergement</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> <strong>Google</strong> — Sheets, Gmail, Calendar (accès opéré par VCEL)</li>
          <li className="flex gap-2"><span className="text-cyan-600 shrink-0">→</span> <strong>OpenAI</strong> — coach IA (données anonymisées)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>6. Conservation</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Les données sont conservées pendant la durée de l'abonnement.{' '}
          <strong>À la résiliation, elles sont supprimées définitivement à la fin de la période payée.</strong>{' '}
          Les données comptables sont conservées 3 ans conformément aux obligations légales.
          Les logs sont conservés 12 mois.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>7. Vos droits</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          Conformément au RGPD, vous disposez des droits d'accès, rectification, suppression, limitation et opposition.
          Contactez-nous à{' '}
          <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>.
          Vous pouvez également introduire une réclamation auprès de la{' '}
          <a href="https://www.cnil.fr" target="_blank" className="text-cyan-600 hover:underline">CNIL</a>.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#0D1B2A' }}>8. Cookies</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#3D5166' }}>
          VCEL utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session d'authentification).
          Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
        </p>
      </section>
    </div>
  )
}

const content: Record<string, JSX.Element> = {
  mentions:        <Mentions />,
  cgv:             <CGV />,
  cgu:             <CGU />,
  confidentialite: <Confidentialite />,
}

function LegalContent() {
  const searchParams = useSearchParams()
  const tabParam     = searchParams.get('tab')
  const validTab     = tabs.find(t => t.id === tabParam)?.id || 'mentions'
  const [active, setActive] = useState(validTab)

  useEffect(() => {
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActive(tabParam)
    }
  }, [tabParam])

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="max-w-3xl mx-auto px-6 py-24">
        <p className="text-cyan-600 text-sm font-semibold mb-2 tracking-wide uppercase">Informations légales</p>
        <h1 className="font-display text-4xl mb-2" style={{ color: '#0D1B2A' }}>Documents légaux</h1>
        <p className="text-sm mb-10" style={{ color: '#7A90A4' }}>Dernière mise à jour : mars 2026</p>

        {/* Onglets */}
        <div className="flex flex-wrap gap-2 mb-10 border-b pb-4" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                padding:         '8px 18px',
                borderRadius:    '10px',
                fontSize:        '14px',
                fontWeight:      active === t.id ? '600' : '500',
                backgroundColor: active === t.id ? '#0D1B2A' : 'white',
                color:           active === t.id ? '#ffffff' : '#7A90A4',
                border:          active === t.id ? '1px solid #0D1B2A' : '1px solid rgba(13,27,42,0.08)',
                cursor:          'pointer',
                transition:      'all 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(13,27,42,0.08)' }}>
          {content[active]}
        </div>

        <p className="text-xs mt-6 text-center" style={{ color: '#A8BDD0' }}>
          Pour toute question :{' '}
          <a href="mailto:contact@vcel.fr" className="text-cyan-600 hover:underline">contact@vcel.fr</a>
        </p>
      </div>
    </main>
  )
}

export default function LegalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4F0' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#0D1B2A', borderTopColor: 'transparent' }} />
      </div>
    }>
      <LegalContent />
    </Suspense>
  )
}