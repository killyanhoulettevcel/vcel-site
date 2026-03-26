// src/app/api/workflows/repair/route.ts
// Réparation IA des workflows en warning
// 1. L'IA analyse l'erreur et tente de relancer via n8n API
// 2. Si succès → statut 'ok'
// 3. Si échec après MAX_TENTATIVES → statut 'erreur' (rouge sur admin)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_TENTATIVES = 3  // Au-delà → erreur rouge

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.PROVISIONING_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { workflowId, n8nWorkflowId, nom } = await req.json()
  if (!workflowId || !n8nWorkflowId) {
    return NextResponse.json({ error: 'workflowId requis' }, { status: 400 })
  }

  const n8nUrl    = process.env.N8N_URL
  const n8nApiKey = process.env.N8N_API_KEY
  const apiKey    = process.env.OPENAI_API_KEY
  const now       = new Date()

  // ── Lire le workflow en base ──────────────────────────────────────────────
  const { data: wf } = await supabaseAdmin
    .from('workflows')
    .select('id, nom, statut, erreur_message, nb_tentatives_repair, derniere_execution, seuil_warning_heures')
    .eq('id', workflowId)
    .single()

  if (!wf) return NextResponse.json({ error: 'Workflow introuvable' }, { status: 404 })

  const nbTentatives = (wf.nb_tentatives_repair || 0) + 1

  // ── Si déjà trop de tentatives → passer en rouge directement ─────────────
  if (nbTentatives > MAX_TENTATIVES) {
    await supabaseAdmin.from('workflows').update({
      statut:                    'erreur',
      erreur_message:            `Réparation IA échouée après ${MAX_TENTATIVES} tentatives — intervention manuelle requise`,
      nb_tentatives_repair:      nbTentatives,
      derniere_tentative_repair: now.toISOString(),
      repair_message:            `Escalade : ${MAX_TENTATIVES} tentatives de réparation automatique ont échoué.`,
      updated_at:                now.toISOString(),
    }).eq('id', workflowId)

    // Notifier l'admin en créant une notification dans la table users admin
    await notifierAdmin(nom, nbTentatives)

    return NextResponse.json({ action: 'escalade', message: 'Workflow passé en erreur rouge — admin notifié' })
  }

  // ── Étape 1 : Récupérer le détail des dernières erreurs depuis n8n ────────
  let contexteErreur = wf.erreur_message || 'Pas de message d\'erreur disponible'
  let derniereExecDetail = null

  try {
    const resDetail = await fetch(
      `${n8nUrl}/api/v1/executions?workflowId=${n8nWorkflowId}&limit=5&status=error`,
      { headers: { 'X-N8N-API-KEY': n8nApiKey! } }
    )
    if (resDetail.ok) {
      const detail = await resDetail.json()
      const exec   = detail.data?.[0]
      if (exec) {
        derniereExecDetail = exec
        contexteErreur = exec?.data?.resultData?.error?.message
          || exec?.data?.resultData?.lastNodeExecuted
          || contexteErreur
      }
    }
  } catch {}

  // ── Étape 2 : Analyse IA de la situation ─────────────────────────────────
  let analyseIA = ''
  let actionIA: 'relancer' | 'attendre' | 'escalader' = 'relancer'

  if (apiKey) {
    try {
      const heuresInactif = wf.derniere_execution
        ? Math.round((now.getTime() - new Date(wf.derniere_execution).getTime()) / 3600000)
        : null

      const prompt = `Tu es un expert en automatisation n8n. Analyse ce workflow en warning et détermine l'action à prendre.

Workflow : "${nom}"
Dernier statut : ${wf.statut}
Message d'erreur : ${contexteErreur}
Dernière exécution : ${wf.derniere_execution ? new Date(wf.derniere_execution).toLocaleString('fr-FR') : 'inconnue'}
${heuresInactif ? `Inactif depuis : ${heuresInactif}h` : ''}
Tentative n° : ${nbTentatives}/${MAX_TENTATIVES}

Réponds UNIQUEMENT en JSON valide :
{
  "action": "relancer" | "attendre" | "escalader",
  "raison": "explication courte en français (max 100 chars)",
  "diagnostic": "ce qui s'est probablement passé (max 150 chars)"
}

- "relancer" : le problème semble transitoire (quota, timeout, réseau) → on retente
- "attendre" : le workflow attend un déclencheur externe → warning normal, pas d'action
- "escalader" : problème structurel (config, credentials, code) → intervention humaine nécessaire`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 200,
          temperature: 0.2,  // Faible pour des réponses deterministes
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data    = await res.json()
      const content = data.choices?.[0]?.message?.content || '{}'
      const parsed  = JSON.parse(content)
      actionIA  = parsed.action   || 'relancer'
      analyseIA = `${parsed.diagnostic || ''} — ${parsed.raison || ''}`.trim()
    } catch {
      actionIA = 'relancer'  // Fallback : on tente quand même
    }
  }

  // ── Étape 3 : Escalade immédiate si IA le recommande ─────────────────────
  if (actionIA === 'escalader') {
    await supabaseAdmin.from('workflows').update({
      statut:                    'erreur',
      erreur_message:            analyseIA || 'Intervention manuelle requise selon analyse IA',
      nb_tentatives_repair:      nbTentatives,
      derniere_tentative_repair: now.toISOString(),
      repair_message:            `IA : escalade recommandée — ${analyseIA}`,
      updated_at:                now.toISOString(),
    }).eq('id', workflowId)

    await notifierAdmin(nom, nbTentatives, analyseIA)
    return NextResponse.json({ action: 'escalade_ia', message: analyseIA })
  }

  // ── Étape 4 : Attente normale (pas d'action) ──────────────────────────────
  if (actionIA === 'attendre') {
    await supabaseAdmin.from('workflows').update({
      nb_tentatives_repair:      nbTentatives,
      derniere_tentative_repair: now.toISOString(),
      repair_message:            `IA : ${analyseIA || 'workflow en attente de déclencheur'}`,
      updated_at:                now.toISOString(),
    }).eq('id', workflowId)

    return NextResponse.json({ action: 'attente', message: analyseIA })
  }

  // ── Étape 5 : Tentative de relance via n8n API ────────────────────────────
  let relancReussi = false
  let relanceMessage = ''

  try {
    // Activer le workflow s'il est désactivé
    const resActivate = await fetch(
      `${n8nUrl}/api/v1/workflows/${n8nWorkflowId}/activate`,
      { method: 'POST', headers: { 'X-N8N-API-KEY': n8nApiKey! } }
    )

    // Déclencher une exécution manuelle
    const resExec = await fetch(
      `${n8nUrl}/api/v1/workflows/${n8nWorkflowId}/run`,
      {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': n8nApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNodes: [], destinationNode: '' }),
      }
    )

    if (resExec.ok) {
      relancReussi  = true
      relanceMessage = `Relancé avec succès (tentative ${nbTentatives}) — ${analyseIA || 'relance automatique'}`
    } else {
      const errBody  = await resExec.text()
      relanceMessage = `Relance échouée : ${errBody.slice(0, 100)}`
    }
  } catch (e: any) {
    relanceMessage = `Erreur réseau lors de la relance : ${e.message?.slice(0, 80)}`
  }

  // ── Étape 6 : Mise à jour du statut selon résultat ───────────────────────
  if (relancReussi) {
    // Attendre 10s puis re-vérifier le statut de l'exécution
    await new Promise(r => setTimeout(r, 10000))

    let statutFinal: 'ok' | 'warning' | 'erreur' = 'warning'
    try {
      const resCheck = await fetch(
        `${n8nUrl}/api/v1/executions?workflowId=${n8nWorkflowId}&limit=1&status=success`,
        { headers: { 'X-N8N-API-KEY': n8nApiKey! } }
      )
      const checkData = await resCheck.json()
      const derniereOk = checkData.data?.[0]
      if (derniereOk && new Date(derniereOk.startedAt) > new Date(now.getTime() - 30000)) {
        // Exécution réussie dans les 30 dernières secondes → OK
        statutFinal = 'ok'
      }
    } catch {}

    await supabaseAdmin.from('workflows').update({
      statut:                    statutFinal,
      nb_tentatives_repair:      nbTentatives,
      derniere_tentative_repair: now.toISOString(),
      repair_message:            relanceMessage,
      erreur_message:            statutFinal === 'ok' ? null : wf.erreur_message,
      updated_at:                now.toISOString(),
    }).eq('id', workflowId)

    if (statutFinal === 'ok') {
      return NextResponse.json({ action: 'repare', message: relanceMessage })
    }
  }

  // Relance échouée → warning persistant ou escalade si trop de tentatives
  const statutUpdate = nbTentatives >= MAX_TENTATIVES ? 'erreur' : 'warning'

  await supabaseAdmin.from('workflows').update({
    statut:                    statutUpdate,
    erreur_message:            nbTentatives >= MAX_TENTATIVES
      ? `Réparation IA échouée après ${nbTentatives} tentatives`
      : wf.erreur_message,
    nb_tentatives_repair:      nbTentatives,
    derniere_tentative_repair: now.toISOString(),
    repair_message:            relanceMessage,
    updated_at:                now.toISOString(),
  }).eq('id', workflowId)

  if (statutUpdate === 'erreur') {
    await notifierAdmin(nom, nbTentatives, relanceMessage)
  }

  return NextResponse.json({
    action:    statutUpdate === 'erreur' ? 'escalade' : 'echec_relance',
    tentative: nbTentatives,
    message:   relanceMessage,
  })
}

// ── Helper : notifier l'admin (notification dans la table dédiée) ──────────
async function notifierAdmin(nomWorkflow: string, nbTentatives: number, detail?: string) {
  try {
    // Récupérer l'admin
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single()

    if (!admin) return

    await supabaseAdmin.from('notifications').insert({
      user_id:    admin.id,
      type:       'alerte',
      titre:      `⚠️ Workflow en échec : ${nomWorkflow.slice(0, 40)}`,
      message:    `${nbTentatives} tentative(s) de réparation automatique échouée(s).${detail ? ' ' + detail.slice(0, 100) : ''} Intervention manuelle requise.`,
      lien:       '/dashboard/admin',
      lu:         false,
      created_at: new Date().toISOString(),
    })
  } catch {}
}