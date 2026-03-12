import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  // Sécurité — cron Vercel ou appel manuel admin
  const authHeader = req.headers.get('authorization')
  const cronSecret = req.headers.get('x-provision-secret')
  if (cronSecret !== process.env.PROVISIONING_SECRET && authHeader !== `Bearer ${process.env.PROVISIONING_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Récupérer tous les workflows en base
  const { data: workflows, error } = await supabaseAdmin
    .from('workflows')
    .select('id, workflow_id, user_id, nom')
    .not('workflow_id', 'is', null)

  if (error || !workflows?.length) {
    return NextResponse.json({ synced: 0 })
  }

  const n8nUrl    = process.env.N8N_URL
  const n8nApiKey = process.env.N8N_API_KEY
  let synced = 0

  for (const wf of workflows) {
    try {
      // Récupérer les exécutions de ce workflow sur n8n
      const res = await fetch(
        `${n8nUrl}/api/v1/executions?workflowId=${wf.workflow_id}&limit=10&status=success`,
        { headers: { 'X-N8N-API-KEY': n8nApiKey! } }
      )

      if (!res.ok) continue
      const data = await res.json()
      const executions = data.data || []

      if (executions.length === 0) continue

      // Dernière exécution
      const derniere     = executions[0]
      const derniereDate = derniere.startedAt || derniere.stoppedAt

      // Compter ce mois
      const debutMois = new Date()
      debutMois.setDate(1)
      debutMois.setHours(0, 0, 0, 0)
      const execMois = executions.filter((e: any) =>
        new Date(e.startedAt) >= debutMois
      ).length

      // Vérifier s'il y a des erreurs récentes
      const resErreurs = await fetch(
        `${n8nUrl}/api/v1/executions?workflowId=${wf.workflow_id}&limit=5&status=error`,
        { headers: { 'X-N8N-API-KEY': n8nApiKey! } }
      )
      const dataErreurs  = resErreurs.ok ? await resErreurs.json() : { data: [] }
      const erreurs      = dataErreurs.data || []
      const derniereErreur = erreurs[0]

      // Déterminer le statut
      let statut = 'ok'
      let erreurMessage = null

      if (erreurs.length > 0 && executions.length > 0) {
        const dateErreur = new Date(erreurs[0].startedAt)
        const dateSucces = new Date(executions[0].startedAt)
        if (dateErreur > dateSucces) {
          statut = 'erreur'
          erreurMessage = derniereErreur?.data?.resultData?.error?.message || 'Erreur inconnue'
        }
      } else if (erreurs.length > 0 && executions.length === 0) {
        statut = 'erreur'
        erreurMessage = derniereErreur?.data?.resultData?.error?.message || 'Erreur inconnue'
      }

      // Mettre à jour Supabase
      await supabaseAdmin
        .from('workflows')
        .update({
          statut,
          actif:               true,
          nb_executions_mois:  execMois,
          derniere_execution:  derniereDate,
          erreur_message:      erreurMessage,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', wf.id)

      synced++
    } catch (e) {
      console.error(`Erreur sync workflow ${wf.workflow_id}:`, e)
    }
  }

  return NextResponse.json({ synced, total: workflows.length })
}
