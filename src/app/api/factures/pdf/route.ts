// src/app/api/factures/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { FacturePDF } from '@/lib/pdf/FacturePDF'
import React from 'react'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const factureId = searchParams.get('id')

  if (!factureId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  // Récupérer la facture
  const { data: facture, error: factureError } = await supabaseAdmin
    .from('factures')
    .select('*')
    .eq('id', factureId)
    .eq('user_id', userId)
    .single()

  if (factureError || !facture) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  // Récupérer le profil vendeur
  const { data: profil, error: profilError } = await supabaseAdmin
    .from('users')
    .select('nom, email, siret, forme_juridique, adresse, code_postal, ville, tva_intracom, telephone, site_web, iban')
    .eq('id', userId)
    .single()

  if (profilError || !profil) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  try {
    // Générer le PDF
    const buffer = await renderToBuffer(
      React.createElement(FacturePDF, { facture, profil })
    )

    const type    = facture.type_facture || 'facture'
    const numero  = facture.numero_facture || factureId
    const filename = `${type}-${numero}.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'no-store',
      },
    })
  } catch (e: any) {
    console.error('[PDF] Erreur génération:', e.message)
    return NextResponse.json({ error: 'Erreur génération PDF: ' + e.message }, { status: 500 })
  }
}