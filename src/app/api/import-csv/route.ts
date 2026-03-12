// src/app/api/import-csv/route.ts
// Import CSV universel → Supabase + Google Sheets
// Détecte automatiquement le type selon les colonnes

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsAppend, getUserSheetId } from '@/lib/googleSheets'

// ── Détection automatique du type de CSV ──────────────────────────────────────
function detectType(headers: string[]): 'ca' | 'leads' | 'factures' | 'factures_fournisseurs' | 'unknown' {
  const h = headers.map(x => x.toLowerCase().trim())
  if (h.includes('ca_ht') || h.includes('marge_brute') || h.includes('charges_total'))
    return 'ca'
  if (h.includes('score') || (h.includes('nom') && h.includes('email') && h.includes('statut') && h.includes('source')))
    return 'leads'
  if (h.includes('invoice_id') || h.includes('invoice_number') || h.includes('hosted_invoice_url'))
    return 'factures'
  if (h.includes('fournisseur') || h.includes('date_reception') || h.includes('numero_facture'))
    return 'factures_fournisseurs'
  return 'unknown'
}

// ── Parseur CSV simple ────────────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[], rows: Record<string, string>[] } {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']))
  })
  return { headers, rows }
}

// ── Transformateurs par type ──────────────────────────────────────────────────
function transformCA(row: Record<string, string>, userId: string) {
  const ca_ht   = parseFloat(row.ca_ht)    || 0
  const charges = parseFloat(row.charges_total) || parseFloat(row.charges) || 0
  return {
    user_id:     userId,
    mois:        row.mois || '',
    ca_ht,
    charges,
    marge:       ca_ht - charges,
    nb_factures: parseInt(row.nb_factures) || 0,
  }
}

function transformLead(row: Record<string, string>, userId: string) {
  return {
    user_id:    userId,
    date:       row.date || new Date().toISOString().split('T')[0],
    nom:        row.nom || '',
    email:      row.email || '',
    telephone:  row.telephone || '',
    entreprise: row.entreprise || '',
    secteur:    row.secteur || '',
    message:    row.message || '',
    score:      parseInt(row.score) || 0,
    statut:     row.statut || 'nouveau',
    source:     row.source || '',
  }
}

function transformFacture(row: Record<string, string>, userId: string) {
  return {
    user_id:           userId,
    invoice_id:        row.invoice_id || '',
    invoice_number:    row.invoice_number || '',
    client_email:      row.client_email || '',
    montant_ht:        parseFloat(row.montant_ht)  || 0,
    montant_ttc:       parseFloat(row.montant_ttc) || 0,
    date:              row.date || new Date().toISOString().split('T')[0],
    statut:            row.statut || 'en attente',
    invoice_pdf:       row.invoice_pdf || '',
    hosted_invoice_url:row.hosted_invoice_url || '',
  }
}

function transformFournisseur(row: Record<string, string>, userId: string) {
  const montant_ht  = parseFloat(row.montant_ht)  || 0
  const tva         = parseFloat(row.tva)          || 0
  return {
    user_id:         userId,
    date_reception:  row.date_reception || new Date().toISOString().split('T')[0],
    fournisseur:     row.fournisseur || '',
    numero_facture:  row.numero_facture || '',
    montant_ht,
    tva,
    montant_ttc:     parseFloat(row.montant_ttc) || montant_ht + tva,
    date_facture:    row.date_facture || '',
    statut:          row.statut || 'reçue',
  }
}

// ── Ligne Google Sheets par type ──────────────────────────────────────────────
function toSheetRow(type: string, data: any): any[] {
  switch (type) {
    case 'ca':
      return [data.mois, data.ca_ht, data.charges, data.marge, 0, Math.round(data.ca_ht * 0.2), 0, Math.round(data.ca_ht * 0.2), data.ca_ht, data.nb_factures, 0, 0]
    case 'leads':
      return [data.date, data.nom, data.email, data.telephone, data.entreprise, data.secteur, data.message, data.score, data.statut, data.source]
    case 'factures':
      return [data.invoice_id, data.invoice_number, data.client_email, data.montant_ht, data.montant_ttc, data.date, data.statut, data.invoice_pdf, data.hosted_invoice_url]
    case 'factures_fournisseurs':
      return [data.date_reception, data.fournisseur, data.numero_facture, data.montant_ht, data.tva, data.montant_ttc, data.date_facture, data.statut]
    default:
      return []
  }
}

const TAB_MAP: Record<string, string> = {
  ca:                   'dashboard!A:L',
  leads:                'CRM_Leads!A:J',
  factures:             'factures!A:I',
  factures_fournisseurs:'factures_fournisseurs!A:H',
}

const TABLE_MAP: Record<string, string> = {
  ca:                   'ca_data',
  leads:                'leads',
  factures:             'factures',
  factures_fournisseurs:'factures_fournisseurs',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

  const text = await file.text()
  const { headers, rows } = parseCSV(text)
  if (!headers.length || !rows.length)
    return NextResponse.json({ error: 'CSV vide ou invalide' }, { status: 400 })

  const type = detectType(headers)
  if (type === 'unknown')
    return NextResponse.json({ error: 'Type de CSV non reconnu. Colonnes détectées: ' + headers.join(', ') }, { status: 400 })

  // Transformer les lignes
  const transformers: Record<string, Function> = {
    ca:                   transformCA,
    leads:                transformLead,
    factures:             transformFacture,
    factures_fournisseurs:transformFournisseur,
  }
  const transformed = rows.filter(r => Object.values(r).some(v => v)).map(r => transformers[type](r, userId))

  // Insérer dans Supabase (par batch de 50)
  const table = TABLE_MAP[type]
  let inserted = 0
  for (let i = 0; i < transformed.length; i += 50) {
    const batch = transformed.slice(i, i + 50)
    const { error } = await supabaseAdmin.from(table).upsert(batch, { onConflict: 'user_id,mois' })
    if (!error) inserted += batch.length
  }

  // Sync Google Sheets
  try {
    const sheetId = await getUserSheetId(supabaseAdmin, userId)
    if (sheetId) {
      const sheetRows = transformed.map(d => toSheetRow(type, d))
      await sheetsAppend(sheetId, TAB_MAP[type], sheetRows)
    }
  } catch (e) {
    console.error('[Import CSV] Erreur sync Sheets:', e)
  }

  return NextResponse.json({
    success: true,
    type,
    inserted,
    total: rows.length,
    message: `${inserted} lignes importées dans "${table}" et Google Sheets`,
  })
}
