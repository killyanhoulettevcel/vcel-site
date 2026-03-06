# VCEL Site — Next.js 14

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en dev
npm run dev
# → http://localhost:3000

# 3. Build production
npm run build && npm start
```

## 📁 Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout + metadata SEO
│   ├── page.tsx         # Page principale (assemble les sections)
│   └── globals.css      # Styles globaux + Tailwind
└── components/
    ├── Navbar.tsx        # Navigation fixe avec scroll effect
    ├── Hero.tsx          # Hero + stats + CTA
    ├── Workflows.tsx     # Les 8 workflows en grid
    ├── Pricing.tsx       # Tarif Pack Starter + comparatif
    ├── FAQ.tsx           # Accordion FAQ
    ├── Contact.tsx       # Formulaire leads (→ connecter à n8n webhook)
    └── Footer.tsx        # Footer
```

## 🔌 Connexions à faire (J3)

### Formulaire Contact → n8n
Dans `Contact.tsx`, décommenter et remplacer :
```js
// await fetch('/api/leads', { method: 'POST', body: JSON.stringify(form) })
// →
await fetch('https://TON_N8N_URL/webhook/vcel-leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form)
})
```

### Stripe Checkout
Créer `src/app/api/checkout/route.ts` :
```ts
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: 'PRICE_ID_VCEL_STARTER', quantity: 1 }],
    discounts: [{ coupon: 'SOLO19' }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/merci`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/#tarifs`,
  })
  return Response.json({ url: session.url })
}
```

## 🎨 Couleurs

| Variable | Valeur | Usage |
|----------|--------|-------|
| navy-950 | #020818 | Background |
| navy-900 | #060d24 | Cards bg |
| accent blue | #3B82F6 | CTA, accents |
| text | white/40-70 | Corps de texte |

## 🚀 Deploy Vercel

```bash
npx vercel deploy
```
Ajouter variables d'env dans Vercel dashboard :
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_URL`
