'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Lock, Briefcase, Save, Check, AlertCircle, Eye, EyeOff, Crown, Calendar } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Profil {
  id: string
  email: string
  nom: string
  secteur: string
  statut: string
  role: string
  created_at: string
  stripe_customer_id: string
}

const secteurs = ['Coach / Formateur', 'Freelance', 'E-commerce', 'Immobilier', 'Consultant', 'PME', 'Autre']

export default function ProfilPage() {
  const { data: session, update } = useSession()
  const [profil, setProfil]   = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  // Formulaires
  const [formInfo, setFormInfo] = useState({ nom: '', email: '', secteur: '' })
  const [formPwd, setFormPwd]   = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPwd, setShowPwd]   = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    const fetchProfil = async () => {
      const res  = await fetch('/api/profil')
      const data = await res.json()
      setProfil(data)
      setFormInfo({ nom: data.nom || '', email: data.email || '', secteur: data.secteur || '' })
      setLoading(false)
    }
    fetchProfil()
  }, [])

  const saveInfo = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    const res  = await fetch('/api/profil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formInfo)
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setProfil(p => p ? { ...p, ...data } : p)
    setSuccess('Informations mises à jour ✓')
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const savePassword = async () => {
    if (formPwd.new_password !== formPwd.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (formPwd.new_password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const res  = await fetch('/api/profil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: formPwd.current_password,
        new_password:     formPwd.new_password,
      })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setFormPwd({ current_password: '', new_password: '', confirm: '' })
    setSuccess('Mot de passe mis à jour ✓')
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
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
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">Mon profil</h1>
        <p className="text-white/40 text-sm">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Carte identité */}
      <div className="card-glass p-6 mb-6 flex items-center gap-5">
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
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              profil?.statut === 'actif' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
            }`}>{profil?.statut}</span>
            {profil?.created_at && (
              <span className="flex items-center gap-1 text-xs text-white/30">
                <Calendar size={10} />
                Membre depuis {new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <div className="card-glass p-4 mb-5 flex items-center gap-3 border-red-500/20 bg-red-500/5">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="card-glass p-4 mb-5 flex items-center gap-3 border-green-500/20 bg-green-500/5">
          <Check size={15} className="text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      {/* Informations */}
      <div className="card-glass p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={15} className="text-blue-400" />
          <h2 className="font-display font-semibold text-white text-sm">Informations personnelles</h2>
        </div>
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
                <input value={formInfo.email} onChange={e => setFormInfo({...formInfo, email: e.target.value})}
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Secteur d'activité</label>
            <div className="flex flex-wrap gap-2">
              {secteurs.map(s => (
                <button key={s} onClick={() => setFormInfo({...formInfo, secteur: s})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    formInfo.secteur === s
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={saveInfo} disabled={saving}
            className="btn-primary disabled:opacity-40">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Sauvegarder</>}
          </button>
        </div>
      </div>

      {/* Mot de passe */}
      <div className="card-glass p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={15} className="text-blue-400" />
          <h2 className="font-display font-semibold text-white text-sm">Changer le mot de passe</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'current_password', label: 'Mot de passe actuel',    show: showPwd.current, toggle: () => setShowPwd(s => ({...s, current: !s.current})) },
            { key: 'new_password',     label: 'Nouveau mot de passe',   show: showPwd.new,     toggle: () => setShowPwd(s => ({...s, new: !s.new})) },
            { key: 'confirm',          label: 'Confirmer le mot de passe', show: showPwd.confirm, toggle: () => setShowPwd(s => ({...s, confirm: !s.confirm})) },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{f.label}</label>
              <div className="relative">
                <input
                  type={f.show ? 'text' : 'password'}
                  value={(formPwd as any)[f.key]}
                  onChange={e => setFormPwd({...formPwd, [f.key]: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pr-10 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                <button onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          {formPwd.new_password && formPwd.confirm && formPwd.new_password !== formPwd.confirm && (
            <p className="text-red-400 text-xs">Les mots de passe ne correspondent pas</p>
          )}
          <button onClick={savePassword} disabled={saving || !formPwd.current_password || !formPwd.new_password || formPwd.new_password !== formPwd.confirm}
            className="btn-primary disabled:opacity-40">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={14} /> Mettre à jour</>}
          </button>
        </div>
      </div>
    </div>
  )
}
