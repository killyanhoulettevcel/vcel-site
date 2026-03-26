// src/app/api/workflows/sync/route.ts
// Synchronisation des workflows depuis n8n — tracking granulaire jour/semaine/mois/total
// Appelé par cron Vercel ou manuellement (admin)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader  = req.headers.get('authorization')
  const cronSecret  = req.headers.get('x-provision-secret')
  if (
    cronSecret !== process.env.PROVISIONING_SECRET &&
    authHeader !== `Bearer ${process.env.PROVISIONING_SECRET}`
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: workflows, error } = await supabaseAdmin
    .from('workflows')
    .select('id, workflow_id, user_id, nom, seuil_warning_heures, nb_tentatives_repair')
    .not('workflow_id', 'is', null)

  if (error || !workflows?.length) return NextResponse.json({ synced: 0 })

  const n8nUrl    = process.env.N8N_URL
  const n8nApiKey = process.env.N8N_API_KEY
  const now       = new Date()
  let synced = 0, warnings = 0, erreurs = 0

  for (const wf of workflows) {
    try {
      // ── Récupérer les exécutions réussies (jusqu'à 50 pour stats) ─────────
      const [resOk, resErr] = await Promise.all([
        fetch(`${n8nUrl}/api/v1/executions?workflowId=${wf.workflow_id}&limit=50&status=success`,
          { headers: { 'X-N8N-API-KEY': n8nApiKey! } }),
        fetch(`${n8nUrl}/api/v1/executions?workflowId=${wf.workflow_id}&limit=10&status=error`,
          { headers: { 'X-N8N-API-KEY': n8nApiKey! } }),
      ])

      if (!resOk.ok) continue

      const execOk  = (await resOk.json()).data  || []
      const execErr = resErr.ok ? (await resErr.json()).data || [] : []

      // ── Calculs temporels ─────────────────────────────────────────────────
      const debutJour     = new Date(now); debutJour.setHours(0, 0, 0, 0)
      const debutSemaine  = new Date(now); debutSemaine.setDate(now.getDate() - 7)
      const debutMois     = new Date(now); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0)

      const execJour    = execOk.filter((e: any) => new Date(e.startedAt) >= debutJour).length
      const execSemaine = execOk.filter((e: any) => new Date(e.startedAt) >= debutSemaine).length
      const execMois    = execOk.filter((e: any) => new Date(e.startedAt) >= debutMois).length
      const execTotal   = execOk.length  // sur les 50 dernières récupérées

      const derniereExec    = execOk[0]?.startedAt   || execOk[0]?.stoppedAt   || null
      const premiereExec    = execOk[execOk.length - 1]?.startedAt || null
      const derniereErreur  = execErr[0]?.startedAt  || null

      // ── Détermination du statut ───────────────────────────────────────────
      // Seuil warning configurable (défaut 48h)
      const seuilWarning = (wf.seuil_warning_heures || 48) * 3600 * 1000
      const heuresDepuisDerniereExec = derniereExec
        ? now.getTime() - new Date(derniereExec).getTime()
        : Infinity

      let statut: 'ok' | 'warning' | 'erreur' | 'inactif' = 'ok'
      let erreurMessage: string | null = null

      if (execOk.length === 0 && execErr.length === 0) {
        // Jamais tourné
        statut = 'inactif'
      } else if (execErr.length > 0) {
        // Comparer date dernière erreur vs dernier succès
        const dateErreur = new Date(execErr[0].startedAt)
        const dateSucces = derniereExec ? new Date(derniereExec) : new Date(0)

        if (dateErreur > dateSucces) {
          // La dernière exécution est une erreur
          statut = 'erreur'
          erreurMessage = execErr[0]?.data?.resultData?.error?.message
            || execErr[0]?.data?.executionStatus
            || 'Erreur inconnue'
        } else if (heuresDepuisDerniereExec > seuilWarning) {
          // Dernier succès OK mais trop ancien
          statut = 'warning'
        }
        // sinon statut reste 'ok'
      } else if (heuresDepuisDerniereExec > seuilWarning) {
        // Pas d'erreur mais pas tourné depuis trop longtemps
        statut = 'warning'
      }

      if (statut === 'warning') warnings++
      if (statut === 'erreur')  erreurs++

      // ── Mise à jour Supabase ──────────────────────────────────────────────
      const updatePayload: any = {
        statut,
        actif:                  statut !== 'inactif',
        nb_executions_jour:     execJour,
        nb_executions_semaine:  execSemaine,
        nb_executions_mois:     execMois,
        nb_executions_total:    execTotal,
        derniere_execution:     derniereExec,
        derniere_erreur:        derniereErreur,
        erreur_message:         erreurMessage,
        updated_at:             now.toISOString(),
      }
      if (premiereExec) updatePayload.premiere_execution = premiereExec

      // Remettre le compteur de tentatives à 0 si le workflow repasse OK
      if (statut === 'ok') {
        updatePayload.nb_tentatives_repair = 0
        updatePayload.repair_message       = null
      }

      await supabaseAdmin.from('workflows').update(updatePayload).eq('id', wf.id)
      synced++

      // ── Déclencher la réparation IA si warning ────────────────────────────
      if (statut === 'warning' && (wf.nb_tentatives_repair || 0) < 3) {
        // Appel en arrière-plan (fire & forget) — ne bloque pas le sync
        fetch(`${process.env.NEXT_PUBLIC_URL}/api/workflows/repair`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PROVISIONING_SECRET}`,
          },
          body: JSON.stringify({ workflowId: wf.id, n8nWorkflowId: wf.workflow_id, nom: wf.nom }),
        }).catch(() => {})
      }

    } catch (e) {
      console.error(`Erreur sync workflow ${wf.workflow_id}:`, e)
    }
  }

  return NextResponse.json({
    synced,
    total: workflows.length,
    warnings,
    erreurs,
    timestamp: now.toISOString(),
  })
}