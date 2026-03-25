// src/lib/googleGmail.ts
import { getValidToken } from './googleCalendar'

// ── Encoder en base64 URL-safe (requis par Gmail API) ─────────────────────────
function encodeBase64(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── Construire le message RFC 2822 ────────────────────────────────────────────
function buildRawEmail(options: {
  from:    string
  to:      string
  subject: string
  html:    string
}): string {
  const boundary = `boundary_${Date.now()}`
  const message = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(options.html).toString('base64'),
    '',
    `--${boundary}--`,
  ].join('\r\n')
  return encodeBase64(message)
}

// ── Envoyer un email via Gmail API ───────────────────────────────────────────
export async function sendEmail(
  token: string,
  options: { from: string; to: string; subject: string; html: string }
): Promise<void> {
  const raw = buildRawEmail(options)
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ raw }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
}

// ── Templates emails ──────────────────────────────────────────────────────────

export function templateRelanceFacture(options: {
  nomClient:     string
  numeroFacture: string
  montant:       number
  dateEcheance:  string
  nomExpediteur: string
}): { subject: string; html: string } {
  const subject = `Rappel de paiement — Facture ${options.numeroFacture}`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
    <h2 style="color: #1e293b; margin-top: 0;">Rappel de paiement</h2>
    <p>Bonjour ${options.nomClient},</p>
    <p>Sauf erreur de notre part, la facture suivante est toujours en attente de règlement :</p>
    <div style="background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 4px 0;"><strong>Facture :</strong> ${options.numeroFacture}</p>
      <p style="margin: 4px 0;"><strong>Montant :</strong> <span style="color: #ef4444; font-size: 18px; font-weight: bold;">${options.montant.toLocaleString('fr-FR')}€ TTC</span></p>
      <p style="margin: 4px 0;"><strong>Échéance :</strong> ${options.dateEcheance}</p>
    </div>
    <p>Merci de procéder au règlement dès que possible. Si vous avez déjà effectué ce paiement, veuillez ignorer ce message.</p>
    <p>Pour toute question, n'hésitez pas à me contacter.</p>
    <p>Cordialement,<br><strong>${options.nomExpediteur}</strong></p>
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">Email envoyé automatiquement via VCEL</p>
</body>
</html>`
  return { subject, html }
}

export function templateRelanceLead(options: {
  nomLead:       string
  nomExpediteur: string
  message?:      string
}): { subject: string; html: string } {
  const subject = `On reste en contact ? 👋`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
    <h2 style="color: #1e293b; margin-top: 0;">On reprend contact ?</h2>
    <p>Bonjour ${options.nomLead},</p>
    <p>${options.message || "Je me permets de revenir vers vous suite à notre dernier échange. Avez-vous eu l'occasion de réfléchir à notre proposition ?"}</p>
    <p>Je reste disponible pour répondre à vos questions ou organiser un appel si vous le souhaitez.</p>
    <p>Cordialement,<br><strong>${options.nomExpediteur}</strong></p>
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">Email envoyé automatiquement via VCEL</p>
</body>
</html>`
  return { subject, html }
}

export function templateBienvenue(options: {
  nomClient:     string
  nomExpediteur: string
}): { subject: string; html: string } {
  const subject = `Bienvenue ! 🎉`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%); border-radius: 12px; padding: 32px; color: white;">
    <h2 style="margin-top: 0;">Bienvenue ${options.nomClient} ! 🎉</h2>
    <p style="color: #cbd5e1;">Je suis ravi de vous compter parmi mes clients.</p>
    <p style="color: #cbd5e1;">N'hésitez pas à me contacter pour toute question — je suis là pour vous aider.</p>
    <p style="color: #cbd5e1;">À très bientôt,<br><strong style="color: white;">${options.nomExpediteur}</strong></p>
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">Email envoyé automatiquement via VCEL</p>
</body>
</html>`
  return { subject, html }
}

// ── Fonction principale : envoyer depuis Supabase token ───────────────────────
export async function sendEmailFromUser(
  supabaseAdmin: any,
  userId: string,
  options: { to: string; subject: string; html: string }
): Promise<void> {
  const token = await getValidToken(supabaseAdmin, userId)
  // Récupérer l'email de l'expéditeur
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, nom')
    .eq('id', userId)
    .single()
  if (!user) throw new Error('Utilisateur introuvable')
  await sendEmail(token, {
    from:    `${user.nom} <${user.email}>`,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
  })
}

export function templateAlertLeadChaud(options: {
  nomLead: string
  entreprise?: string
  email: string
  telephone?: string
  source?: string
  scoreIaRaison?: string
  scoreIaAction?: string
  nomExpediteur: string
  dashboardUrl: string
}): { subject: string; html: string } {
  const subject = `🔥 Lead chaud : ${options.nomLead}`
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);border-radius:16px 16px 0 0;padding:28px 32px;">
          <p style="margin:0 0 4px;color:#fca5a5;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Alerte Lead Chaud</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🔥 ${options.nomLead}</h1>
          ${options.entreprise ? `<p style="margin:6px 0 0;color:#fecaca;font-size:14px;">${options.entreprise}</p>` : ''}
        </td></tr>

        <tr><td style="background:#ffffff;padding:24px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 16px;color:#475569;font-size:14px;">Ce lead vient d'être qualifié comme <strong style="color:#dc2626;">chaud</strong>. Contacte-le maintenant pendant que l'intérêt est peak.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0;margin-bottom:16px;">
            <tr><td>
              <p style="margin:0 0 8px;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Contact</p>
              <p style="margin:0 0 4px;color:#1e293b;font-size:14px;">📧 ${options.email}</p>
              ${options.telephone ? `<p style="margin:0 0 4px;color:#1e293b;font-size:14px;">📞 ${options.telephone}</p>` : ''}
              ${options.source ? `<p style="margin:0;color:#64748b;font-size:12px;">Source : ${options.source}</p>` : ''}
            </td></tr>
          </table>

          ${options.scoreIaRaison ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;padding:16px;border:1px solid #fecaca;border-left:4px solid #dc2626;margin-bottom:16px;">
            <tr><td>
              <p style="margin:0 0 6px;color:#991b1b;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">🤖 Analyse IA</p>
              <p style="margin:0 0 8px;color:#7f1d1d;font-size:13px;">${options.scoreIaRaison}</p>
              ${options.scoreIaAction ? `<p style="margin:0;color:#dc2626;font-size:13px;font-weight:600;">→ ${options.scoreIaAction}</p>` : ''}
            </td></tr>
          </table>
          ` : ''}
        </td></tr>

        <tr><td style="background:#ffffff;padding:8px 32px 28px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;text-align:center;">
          <a href="${options.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:700;font-size:14px;">
            Voir le lead →
          </a>
        </td></tr>

        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">VCEL · Alerte automatique lead chaud</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  return { subject, html }
}