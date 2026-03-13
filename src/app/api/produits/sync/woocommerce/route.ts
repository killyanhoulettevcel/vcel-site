// src/app/api/produits/sync/woocommerce/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { shop_url, api_key, api_secret } = await req.json()
  if (!shop_url || !api_key || !api_secret)
    return NextResponse.json({ error: 'shop_url, api_key et api_secret requis' }, { status: 400 })

  const cleanUrl = shop_url.replace(/\/$/, '')
  const auth = Buffer.from(`${api_key}:${api_secret}`).toString('base64')
  const headers = { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }

  try {
    const [prodRes, orderRes] = await Promise.all([
      fetch(`${cleanUrl}/wp-json/wc/v3/products?per_page=100`, { headers }),
      fetch(`${cleanUrl}/wp-json/wc/v3/orders?status=completed&per_page=100`, { headers }),
    ])
    if (!prodRes.ok) return NextResponse.json({ error: 'Identifiants WooCommerce invalides' }, { status: 400 })
    const products = await prodRes.json()
    const orders   = await orderRes.json()

    let produitsSynced = 0
    let ventesSynced   = 0

    for (const p of products) {
      await supabaseAdmin.from('produits').upsert({
        user_id:      userId,
        nom:          p.name,
        description:  p.short_description?.replace(/<[^>]+>/g, '') || '',
        prix_vente:   parseFloat(p.price) || 0,
        cout_revient: parseFloat(p.regular_price) || 0,
        stock:        p.stock_quantity || 0,
        categorie:    p.categories?.[0]?.name || '',
        source:       'woocommerce',
        source_id:    `woo-${p.id}`,
        actif:        p.status === 'publish',
      }, { onConflict: 'user_id,source_id' })
      produitsSynced++
    }

    for (const order of orders) {
      for (const item of order.line_items || []) {
        const { data: prod } = await supabaseAdmin
          .from('produits').select('id').eq('user_id', userId).eq('source_id', `woo-${item.product_id}`).single()
        await supabaseAdmin.from('ventes').upsert({
          user_id:       userId,
          produit_id:    prod?.id || null,
          produit_nom:   item.name,
          quantite:      item.quantity,
          prix_unitaire: parseFloat(item.price),
          source:        'woocommerce',
          source_id:     `woo-${order.id}-${item.id}`,
          date_vente:    order.date_created?.split('T')[0],
        }, { onConflict: 'user_id,source_id' })
        ventesSynced++
      }
    }

    await supabaseAdmin.from('connecteurs').upsert({
      user_id:       userId,
      type:          'woocommerce',
      shop_url:      cleanUrl,
      api_key,
      api_secret,
      actif:         true,
      derniere_sync: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    return NextResponse.json({ success: true, produitsSynced, ventesSynced })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
