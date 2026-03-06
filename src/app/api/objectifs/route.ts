import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id

  // Récupérer objectifs + données réelles en parallèle
  const [objRes, caRes, leadsRes, facturesRes] = await Promise.all([
    supabaseAdmin.from('objectifs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseAdmin.from('ca_data').select('ca_ht, mois, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('leads').select('id, statut, created_at').eq('user_id', userId),
    supabaseAdmin.from('factures').select('montant_ttc, statut').eq('user_id', userId),
  ])

  const objectifs = objRes.data || []
  const now = new Date()

  // Valeurs réelles ce mois
  const caMois = caRes.data?.[0]?.ca_ht || 0
  const leadsTotal = leadsRes.data?.length || 0
  const leadsMois  = (leadsRes.data || []).filter(l => {
    const d = new Date(l.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const leadsConvertis = (leadsRes.data || []).filter(l => l.statut === 'converti').length
  const tauxConversion = leadsTotal > 0 ? Math.round(leadsConvertis / leadsTotal * 100) : 0
  const montantDu = (facturesRes.data || []).filter(f => f.statut !== 'payée').reduce((s, f) => s + (f.montant_ttc || 0), 0)

  return NextResponse.json({
    objectifs,
    reels: { caMois, leadsMois, leadsTotal, tauxConversion, montantDu }
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const body   = await req.json()

  const { data, error } = await supabaseAdmin
    .from('objectifs')
    .insert({
      user_id:    userId,
      type:       body.type,
      label:      body.label,
      cible:      parseFloat(body.cible) || 0,
      periode:    body.periode || 'mensuel',
      actif:      true,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabaseAdmin
    .from('objectifs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { error } = await supabaseAdmin
    .from('objectifs')
    .delete()
    .eq('id', id!)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
