'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Lock, Save, Check, AlertCircle, Eye, EyeOff, Crown, Calendar, Zap, Bell, CreditCard, RefreshCw, Plug, ToggleLeft, ToggleRight, ExternalLink, Trash2, FileText, Building2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Profil {
  id: string; email: string; nom: string; secteur: string; statut: string
  role: string; created_at: string; stripe_customer_id?: string
  google_access_token?: string; preferences?: Preferences
  siret?: string; forme_juridique?: string; adresse?: string
  code_postal?: string; ville?: string; tva_intracom?: string
  telephone?: string; site_web?: string; iban?: string
}

interface Preferences {
  relance_factures_auto:  boolean
  relance_factures_delai: number
  relance_leads_auto:     boolean
  relance_leads_delai:    number
  resume_hebdo:           boolean
  notifications_email:    boolean
}

const defaultPrefs: Preferences = {
  relance_factures_auto:  false,
  relance_factures_delai: 7,
  relance_leads_auto:     false,
  relance_leads_delai:    5,
  resume_hebdo:           false,
  notifications_email:    true,
}

const secteurs = ['Coach / Formateur', 'Freelance', 'E-commerce', 'Immobilier', 'Consultant', 'PME', 'Autre']

const tabs = [
  { id: 'profil',        label: 'Profil',        icon: User },
  { id: 'facturation',   label: 'Facturation',   icon: FileText },
  { id: 'integrations',  label: 'Intégrations',  icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'abonnement',    label: 'Abonnement',    icon: CreditCard },
]

export default function ParametresPage() {
  const { data: session } = useSession()
  const [profil,  setProfil]  = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState('profil')

  const [formInfo, setFormInfo] = useState({ nom: '', email: '', secteur: '' })
  const [formFactu, setFormFactu] = useState({
    siret: '', forme_juridique: '', adresse: '', code_postal: '',
    ville: '', tva_intracom: '', telephone: '', site_web: '', iban: '',
  })
  const [formPwd,  setFormPwd]  = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPwd,  setShowPwd]  = useState({ current: false, new: false, confirm: false })
  const [prefs,    setPrefs]    = useState<Preferences>(defaultPrefs)
  const [connecteurs, setConnecteurs] = useState<any[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const [profilRes, connRes] = await Promise.all([
        fetch('/api/profil').then(r => r.json()),
        fetch('/api/produits').then(r => r.json()).catch(() => []),
      ])
      setProfil(profilRes)
      setFormInfo({ nom: profilRes.nom || '', email: profilRes.email || '', secteur: profilRes.secteur || '' })
      setFormFactu({
        siret:           profilRes.siret           || '',
        forme_juridique: profilRes.forme_juridique || '',
        adresse:         profilRes.adresse         || '',
        code_postal:     profilRes.code_postal     || '',
        ville:           profilRes.ville           || '',
        tva_intracom:    profilRes.tva_intracom    || '',
        telephone:       profilRes.telephone       || '',
        site_web:        profilRes.site_web        || '',
        iban:            profilRes.iban            || '',
      })
      setPrefs({ ...defaultPrefs, ...(profilRes.preferences || {}) })
      // Récupérer les connecteurs
      const connRes2 = await fetch('/api/connecteurs').then(r => r.json()).catch(() => [])
      setConnecteurs(Array.isArray(connRes2) ? connRes2 : [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  const showError   = (msg: string) => { setError(msg);   setTimeout(() => setError(''),   4000) }

  const saveInfo = async () => {
    setSaving(true); setError('')
    const res  = await fetch('/api/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formInfo) })
    const data = await res.json()
    if (!res.ok) { showError(data.error); setSaving(false); return }
    setProfil(p => p ? { ...p, ...data } : p)
    showSuccess('Informations mises à jour ✓')
    setSaving(false)
  }

  const savePassword = async () => {
    if (formPwd.new_password !== formPwd.confirm) { showError('Les mots de passe ne correspondent pas'); return }
    if (formPwd.new_password.length < 8) { showError('Minimum 8 caractères'); return }
    setSaving(true); setError('')
    const res  = await fetch('/api/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: formPwd.current_password, new_password: formPwd.new_password }) })
    const data = await res.json()
    if (!res.ok) { showError(data.error); setSaving(false); return }
    setFormPwd({ current_password: '', new_password: '', confirm: '' })
    showSuccess('Mot de passe mis à jour ✓')
    setSaving(false)
  }

  const savePrefs = async (newPrefs: Preferences) => {
    setPrefs(newPrefs)
    await fetch('/api/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: newPrefs }) })
    showSuccess('Préférences sauvegardées ✓')
  }

  const togglePref = (key: keyof Preferences) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] }
    savePrefs(newPrefs)
  }

  const updatePrefDelai = (key: keyof Preferences, val: number) => {
    setPrefs(p => ({ ...p, [key]: val }))
  }

  const disconnectGoogle = async () => {
    if (!confirm('Déconnecter Google Calendar et Gmail ?')) return
    await fetch('/api/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disconnect_google: true }) })
    setProfil(p => p ? { ...p, google_access_token: undefined } : p)
    showSuccess('Google déconnecté ✓')
  }

  const deleteConnecteur = async (id: string) => {
    if (!confirm('Supprimer ce connecteur ?')) return
    await fetch(`/api/connecteurs?id=${id}`, { method: 'DELETE' })
    setConnecteurs(c => c.filter(x => x.id !== id))
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-white/30">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-1">Paramètres</h1>
        <p className="text-white/40 text-sm">Gérez votre compte, intégrations et préférences</p>
      </div>

      {/* Alertes */}
      {error   && <div className="card-glass p-4 mb-5 flex items-center gap-3 border-red-500/20 bg-red-500/5"><AlertCircle size={15} className="text-red-400 shrink-0" /><p className="text-red-300 text-sm">{error}</p></div>}
      {success && <div className="card-glass p-4 mb-5 flex items-center gap-3 border-green-500/20 bg-green-500/5"><Check size={15} className="text-green-400 shrink-0" /><p className="text-green-300 text-sm">{success}</p></div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              tab === t.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
            }`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFIL ───────────────────────────────────────────────────────────── */}
      {tab === 'profil' && (
        <div className="space-y-5">
          {/* Carte identité */}
          <div className="card-glass p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 font-display text-2xl font-bold">
              {(profil?.nom || profil?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-display font-bold text-white text-lg">{profil?.nom || '—'}</p>
                {profil?.role === 'admin' && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                    <Crown size={10} /> Admin
                  </span>
                )}
              </div>
              <p className="text-white/40 text-sm">{profil?.email}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profil?.statut === 'actif' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>{profil?.statut}</span>
                {profil?.created_at && (
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <Calendar size={10} />
                    Membre depuis {new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Infos */}
          <div className="card-glass p-6">
            <div className="flex items-center gap-2 mb-5"><User size={15} className="text-blue-400" /><h2 className="font-display font-semibold text-white text-sm">Informations personnelles</h2></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Prénom / Nom</label>
                  <input value={formInfo.nom} onChange={e => setFormInfo({...formInfo, nom: e.target.value})}
                    placeholder="Killyan Houlette"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={formInfo.email} onChange={e => setFormInfo({...formInfo, email: e.target.value})} type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Secteur d'activité</label>
                <div className="flex flex-wrap gap-2">
                  {secteurs.map(s => (
                    <button key={s} onClick={() => setFormInfo({...formInfo, secteur: s})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formInfo.secteur === s ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <button onClick={saveInfo} disabled={saving} className="btn-primary disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Sauvegarder</>}
              </button>
            </div>
          </div>

          {/* Mot de passe */}
          <div className="card-glass p-6">
            <div className="flex items-center gap-2 mb-5"><Lock size={15} className="text-blue-400" /><h2 className="font-display font-semibold text-white text-sm">Changer le mot de passe</h2></div>
            <div className="space-y-3">
              {[
                { key: 'current_password', label: 'Mot de passe actuel',      show: showPwd.current, toggle: () => setShowPwd(s => ({...s, current: !s.current})) },
                { key: 'new_password',     label: 'Nouveau mot de passe',     show: showPwd.new,     toggle: () => setShowPwd(s => ({...s, new: !s.new})) },
                { key: 'confirm',          label: 'Confirmer mot de passe',   show: showPwd.confirm, toggle: () => setShowPwd(s => ({...s, confirm: !s.confirm})) },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{f.label}</label>
                  <div className="relative">
                    <input type={f.show ? 'text' : 'password'} value={(formPwd as any)[f.key]}
                      onChange={e => setFormPwd({...formPwd, [f.key]: e.target.value})} placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pr-10 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                    <button onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={savePassword} disabled={saving || !formPwd.current_password || !formPwd.new_password || formPwd.new_password !== formPwd.confirm}
                className="btn-primary disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={14} /> Mettre à jour</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTÉGRATIONS ─────────────────────────────────────────────────────── */}

      {tab === 'facturation' && (
        <div className="space-y-5">
          <div className="card-glass p-5 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={15} style={{ color: 'var(--cyan)' }} />
              <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Informations émetteur</h2>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Ces informations apparaîtront automatiquement sur toutes vos factures, devis et avoirs.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Forme juridique</label>
                  <select value={formFactu.forme_juridique} onChange={e => setFormFactu({...formFactu, forme_juridique: e.target.value})} className="input-field">
                    <option value="">Sélectionner...</option>
                    {['Auto-entrepreneur', 'EI', 'EURL', 'SARL', 'SASU', 'SAS', 'SA', 'Autre'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SIRET</label>
                  <input value={formFactu.siret} onChange={e => setFormFactu({...formFactu, siret: e.target.value})} placeholder="123 456 789 00012" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Adresse</label>
                <input value={formFactu.adresse} onChange={e => setFormFactu({...formFactu, adresse: e.target.value})} placeholder="12 rue de la Paix" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Code postal</label>
                  <input value={formFactu.code_postal} onChange={e => setFormFactu({...formFactu, code_postal: e.target.value})} placeholder="75001" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ville</label>
                  <input value={formFactu.ville} onChange={e => setFormFactu({...formFactu, ville: e.target.value})} placeholder="Paris" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>N° TVA intracommunautaire</label>
                  <input value={formFactu.tva_intracom} onChange={e => setFormFactu({...formFactu, tva_intracom: e.target.value})} placeholder="FR12345678901 (vide si non assujetti)" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Téléphone</label>
                  <input value={formFactu.telephone} onChange={e => setFormFactu({...formFactu, telephone: e.target.value})} placeholder="+33 6 12 34 56 78" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Site web</label>
                <input value={formFactu.site_web} onChange={e => setFormFactu({...formFactu, site_web: e.target.value})} placeholder="https://monsite.fr" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>IBAN (affiché sur les factures)</label>
                <input value={formFactu.iban} onChange={e => setFormFactu({...formFactu, iban: e.target.value})} placeholder="FR76 3000 6000 0112 3456 7890 189" className="input-field" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={async () => {
                  setSaving(true)
                  const res = await fetch('/api/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formFactu) })
                  if (res.ok) showSuccess('Informations de facturation sauvegardées ✓')
                  else showError('Erreur lors de la sauvegarde')
                  setSaving(false)
                }}
                disabled={saving}
                className="btn-primary text-sm flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Aperçu */}
          <div className="card-glass p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Aperçu mentions légales</h3>
            <div className="text-xs space-y-1 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formInfo.nom}{formFactu.forme_juridique ? ` — ${formFactu.forme_juridique}` : ''}</p>
              {formFactu.adresse && <p>{formFactu.adresse}, {formFactu.code_postal} {formFactu.ville}</p>}
              {formFactu.siret ? <p>SIRET : {formFactu.siret}</p> : <p className="italic" style={{ color: '#EF4444' }}>⚠ SIRET non renseigné</p>}
              {formFactu.tva_intracom ? <p>TVA : {formFactu.tva_intracom}</p> : <p>TVA non applicable — Art. 293B CGI</p>}
              {formFactu.iban && <p>IBAN : {formFactu.iban}</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="space-y-4">
          {/* Google */}
          <div className="card-glass p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Google Calendar & Gmail</p>
                  <p className="text-white/30 text-xs">Agenda, événements et envoi d'emails</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {profil?.google_access_token ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Connecté</span>
                    <button onClick={disconnectGoogle} className="text-white/20 hover:text-red-400 transition-colors text-xs">Déconnecter</button>
                  </>
                ) : (
                  <a href="/api/auth/google-calendar" className="btn-primary text-xs py-2 px-3">Connecter</a>
                )}
              </div>
            </div>
          </div>

          {/* Connecteurs e-commerce */}
          <div className="card-glass p-6">
            <div className="flex items-center gap-2 mb-4"><Plug size={15} className="text-blue-400" /><h2 className="font-display font-semibold text-white text-sm">Connecteurs e-commerce</h2></div>
            {connecteurs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-white/30 text-sm mb-3">Aucun connecteur configuré</p>
                <a href="/dashboard/client/produits" className="btn-primary text-xs py-2 px-3">Configurer depuis Produits & Ventes</a>
              </div>
            ) : (
              <div className="space-y-3">
                {connecteurs.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3">
                    <div>
                      <p className="text-white text-xs font-medium capitalize">{c.type}</p>
                      <p className="text-white/30 text-xs">{c.shop_url || c.api_url || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Actif</span>
                      <button onClick={() => deleteConnecteur(c.id)} className="text-white/20 hover:text-red-400 p-1"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stripe */}
          <div className="card-glass p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <CreditCard size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Stripe</p>
                  <p className="text-white/30 text-xs">Paiements et abonnements</p>
                </div>
              </div>
              {profil?.stripe_customer_id ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Connecté</span>
              ) : (
                <span className="text-xs text-white/30">Non configuré</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ────────────────────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          {/* Toggle helper */}
          {[
            {
              key: 'relance_factures_auto' as keyof Preferences,
              delaiKey: 'relance_factures_delai' as keyof Preferences,
              label: 'Relances factures automatiques',
              desc: 'Envoie automatiquement un email de relance aux clients avec des factures impayées',
              delaiLabel: 'Relancer après',
              delaiUnit: 'jours de retard',
              color: 'text-orange-400',
            },
            {
              key: 'relance_leads_auto' as keyof Preferences,
              delaiKey: 'relance_leads_delai' as keyof Preferences,
              label: 'Relances leads automatiques',
              desc: 'Relance automatiquement les leads qui n\'ont pas répondu depuis X jours',
              delaiLabel: 'Relancer après',
              delaiUnit: 'jours sans réponse',
              color: 'text-blue-400',
            },
          ].map(item => (
            <div key={item.key} className="card-glass p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell size={14} className={item.color} />
                    <p className="text-white text-sm font-medium">{item.label}</p>
                  </div>
                  <p className="text-white/40 text-xs mb-4">{item.desc}</p>
                  {prefs[item.key] && (
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-xs">{item.delaiLabel}</span>
                      <input type="number" min={1} max={30} value={prefs[item.delaiKey] as number}
                        onChange={e => updatePrefDelai(item.delaiKey, Number(e.target.value))}
                        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-blue-500/50" />
                      <span className="text-white/40 text-xs">{item.delaiUnit}</span>
                      <button onClick={() => savePrefs(prefs)} className="btn-primary text-xs py-1.5 px-3">
                        <Save size={11} /> Sauvegarder
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => togglePref(item.key)} className="shrink-0 mt-0.5">
                  {prefs[item.key]
                    ? <ToggleRight size={28} className="text-blue-400" />
                    : <ToggleLeft  size={28} className="text-white/20" />
                  }
                </button>
              </div>
              {!profil?.google_access_token && prefs[item.key] && (
                <div className="mt-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
                  <AlertCircle size={13} className="text-orange-400 shrink-0" />
                  <p className="text-orange-300 text-xs">Google Gmail non connecté — <a href="/api/auth/google-calendar" className="underline">Connecter maintenant</a></p>
                </div>
              )}
            </div>
          ))}

          {/* Résumé hebdo */}
          <div className="card-glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-purple-400" />
                  <p className="text-white text-sm font-medium">Résumé hebdomadaire IA</p>
                </div>
                <p className="text-white/40 text-xs">Reçois chaque lundi un résumé de tes performances de la semaine</p>
              </div>
              <button onClick={() => togglePref('resume_hebdo')} className="shrink-0 mt-0.5">
                {prefs.resume_hebdo
                  ? <ToggleRight size={28} className="text-blue-400" />
                  : <ToggleLeft  size={28} className="text-white/20" />
                }
              </button>
            </div>
          </div>

          {/* Notifications email */}
          <div className="card-glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={14} className="text-green-400" />
                  <p className="text-white text-sm font-medium">Notifications par email</p>
                </div>
                <p className="text-white/40 text-xs">Recevoir les alertes importantes par email</p>
              </div>
              <button onClick={() => togglePref('notifications_email')} className="shrink-0 mt-0.5">
                {prefs.notifications_email
                  ? <ToggleRight size={28} className="text-blue-400" />
                  : <ToggleLeft  size={28} className="text-white/20" />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ABONNEMENT ───────────────────────────────────────────────────────── */}
      {tab === 'abonnement' && (
        <div className="space-y-4">
          <div className="card-glass p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Zap size={16} className="text-blue-400" fill="currentColor" />
              </div>
              <div>
                <p className="text-white font-semibold">Plan VCEL</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profil?.statut === 'actif' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                  {profil?.statut === 'actif' ? '✓ Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {['Dashboard temps réel', 'Coach IA connecté', 'Workflows n8n', 'Agenda Google Calendar', 'Emails automatiques', 'Produits & Ventes'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                  <Check size={12} className="text-green-400" /> {f}
                </div>
              ))}
            </div>
            {profil?.stripe_customer_id ? (
              <a href="https://billing.stripe.com/p/login/test_00000" target="_blank" rel="noopener noreferrer"
                className="btn-primary text-sm w-full justify-center">
                <ExternalLink size={14} /> Gérer mon abonnement
              </a>
            ) : (
              <a href="/#tarifs" className="btn-primary text-sm w-full justify-center">
                Voir les offres
              </a>
            )}
          </div>

          <div className="card-glass p-5 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Facturation</p>
              <p className="text-white/30 text-xs">Voir vos factures et historique de paiement</p>
            </div>
            {profil?.stripe_customer_id ? (
              <a href="https://billing.stripe.com/p/login/test_00000" target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5">
                <ExternalLink size={12} /> Portail Stripe
              </a>
            ) : (
              <span className="text-white/20 text-xs">Non disponible</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}