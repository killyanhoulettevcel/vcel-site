// src/app/api/produits/sync/shopify/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { shop_url, api_key } = await req.json()
  if (!shop_url || !api_key) return NextResponse.json({ error: 'shop_url et api_key requis' }, { status: 400 })

  const cleanUrl = shop_url.replace(/\/$/, '').replace(/^https?:\/\//, '')

  try {
    // Récupérer les produits Shopify
    const res = await fetch(`https://${cleanUrl}/admin/api/2024-01/products.json?limit=250`, {
      headers: { 'X-Shopify-Access-Token': api_key, 'Content-Type': 'application/json' }
    })
    if (!res.ok) return NextResponse.json({ error: 'Clé API ou URL Shopify invalide' }, { status: 400 })
    const { products } = await res.json()

    // Récupérer les commandes récentes (30 derniers jours) pour les ventes
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const ordersRes = await fetch(
      `https://${cleanUrl}/admin/api/2024-01/orders.json?status=paid&created_at_min=${since}&limit=250`,
      { headers: { 'X-Shopify-Access-Token': api_key } }
    )
    const { orders } = await ordersRes.json()

    let produitsSynced = 0
    let ventesSynced   = 0

    // Upsert produits
    for (const p of products) {
      const variant = p.variants?.[0]
      await supabaseAdmin.from('produits').upsert({
        user_id:      userId,
        nom:          p.title,
        description:  p.body_html?.replace(/<[^>]+>/g, '') || '',
        prix_vente:   parseFloat(variant?.price) || 0,
        cout_revient: parseFloat(variant?.compare_at_price) || 0,
        stock:        variant?.inventory_quantity || 0,
        categorie:    p.product_type || '',
        source:       'shopify',
        source_id:    String(p.id),
        actif:        p.status === 'active',
      }, { onConflict: 'user_id,source_id' })
      produitsSynced++
    }

    // Upsert ventes depuis commandes
    for (const order of orders) {
      for (const item of order.line_items || []) {
        // Trouver le produit_id local
        const { data: prod } = await supabaseAdmin
          .from('produits').select('id').eq('user_id', userId).eq('source_id', String(item.product_id)).single()
        await supabaseAdmin.from('ventes').upsert({
          user_id:       userId,
          produit_id:    prod?.id || null,
          produit_nom:   item.title,
          quantite:      item.quantity,
          prix_unitaire: parseFloat(item.price),
          source:        'shopify',
          source_id:     `shopify-${order.id}-${item.id}`,
          date_vente:    order.created_at?.split('T')[0],
        }, { onConflict: 'user_id,source_id' })
        ventesSynced++
      }
    }

    // Sauvegarder le connecteur
    await supabaseAdmin.from('connecteurs').upsert({
      user_id:       userId,
      type:          'shopify',
      shop_url:      cleanUrl,
      api_key,
      actif:         true,
      derniere_sync: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    return NextResponse.json({ success: true, produitsSynced, ventesSynced })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
