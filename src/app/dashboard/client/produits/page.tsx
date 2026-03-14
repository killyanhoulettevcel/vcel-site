'use client'
import { useState, useEffect } from 'react'
import {
  Package, TrendingUp, ShoppingCart, Plus, Pencil, Trash2, X, Check,
  RefreshCw, Download, Zap, AlertCircle, ExternalLink, BarChart2, ShoppingBag, FileText
} from 'lucide-react'
import { exportCSV } from '@/lib/exportCSV'

interface Produit {
  id: string
  nom: string
  description?: string
  prix_vente: number
  cout_revient: number
  marge: number
  taux_marge: number
  stock: number
  categorie?: string
  source: string
  updated_at: string
}

interface Vente {
  id: string
  produit_id?: string
  produit_nom: string
  quantite: number
  prix_unitaire: number
  total: number
  date_vente: string
  source: string
  produits?: { nom: string, categorie: string }
}

const sourceColors: Record<string, string> = {
  manuel:      'bg-white/10 text-white/40',
  shopify:     'bg-green-500/10 text-green-400',
  woocommerce: 'bg-purple-500/10 text-purple-400',
  stripe:      'bg-blue-500/10 text-blue-400',
}

const emptyProduit = { nom: '', description: '', prix_vente: '', cout_revient: '', stock: '', categorie: '' }
const emptyVente   = { produit_id: '', produit_nom: '', quantite: '1', prix_unitaire: '', date_vente: new Date().toISOString().split('T')[0] }

type Tab = 'produits' | 'ventes' | 'connecteurs'

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [ventes,   setVentes]   = useState<Vente[]>([])
  const [loadP,    setLoadP]    = useState(true)
  const [loadV,    setLoadV]    = useState(true)

  const refreshP = async () => {
    setLoadP(true)
    try { const r = await fetch('/api/produits'); if (r.ok) setProduits(await r.json()) } catch {}
    setLoadP(false)
  }

  const refreshV = async () => {
    setLoadV(true)
    try { const r = await fetch('/api/ventes'); if (r.ok) setVentes(await r.json()) } catch {}
    setLoadV(false)
  }

  useEffect(() => {
    refreshP()
    refreshV()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [tab,          setTab]          = useState<Tab>('produits')
  const [showModal,    setShowModal]    = useState<'produit' | 'vente' | 'connecteur' | null>(null)
  const [editProduit,  setEditProduit]  = useState<Produit | null>(null)
  const [formP,        setFormP]        = useState(emptyProduit)
  const [formV,        setFormV]        = useState(emptyVente)
  const [saving,       setSaving]       = useState(false)
  const [syncing,      setSyncing]      = useState<string | null>(null)
  const [syncResult,   setSyncResult]   = useState<string>('')
  const [connecteurTab, setConnecteurTab] = useState<'shopify'|'woocommerce'|'stripe'>('shopify')
  const [shopifyForm,  setShopifyForm]  = useState({ shop_url: '', api_key: '' })
  const [wooForm,      setWooForm]      = useState({ shop_url: '', api_key: '', api_secret: '' })

  // Stats
  const totalProduits  = produits.length
  const totalVentes    = ventes.reduce((s, v) => s + (v.total || 0), 0)
  const bestSellers    = [...produits].sort((a, b) => {
    const va = ventes.filter(v => v.produit_id === a.id).reduce((s, v) => s + v.quantite, 0)
    const vb = ventes.filter(v => v.produit_id === b.id).reduce((s, v) => s + v.quantite, 0)
    return vb - va
  }).slice(0, 3)
  const margeMoyenne   = produits.length > 0
    ? Math.round(produits.reduce((s, p) => s + (p.taux_marge || 0), 0) / produits.length)
    : 0

  const openCreateProduit = () => { setEditProduit(null); setFormP(emptyProduit); setShowModal('produit') }
  const openEditProduit   = (p: Produit) => {
    setEditProduit(p)
    setFormP({ nom: p.nom, description: p.description||'', prix_vente: String(p.prix_vente), cout_revient: String(p.cout_revient), stock: String(p.stock), categorie: p.categorie||'' })
    setShowModal('produit')
  }

  const saveProduit = async () => {
    setSaving(true)
    if (editProduit) {
      await fetch('/api/produits', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editProduit.id, ...formP }) })
    } else {
      await fetch('/api/produits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formP) })
    }
    setSaving(false); setShowModal(null); refreshP()
  }

  const deleteProduit = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/produits?id=${id}`, { method: 'DELETE' })
    refreshP()
  }

  const saveVente = async () => {
    setSaving(true)
    const produit = produits.find(p => p.id === formV.produit_id)
    const body = {
      produit_id:    formV.produit_id || null,
      produit_nom:   produit?.nom || formV.produit_nom,
      quantite:      formV.quantite,
      prix_unitaire: formV.prix_unitaire,
      date_vente:    formV.date_vente,
    }
    const res = await fetch('/api/ventes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('Erreur vente:', err)
    }
    setSaving(false)
    setShowModal(null)
    setFormV(emptyVente)
    refreshV()
  }

  const deleteVente = async (id: string) => {
    if (!confirm('Supprimer cette vente ?')) return
    await fetch(`/api/ventes?id=${id}`, { method: 'DELETE' })
    refreshV()
  }

  const facturerVente = async (v: Vente) => {
    // Créer la facture automatiquement
    const numero = `F-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const montantHt  = v.total || (v.quantite * v.prix_unitaire)
    const tva        = Math.round(montantHt * 0.2 * 100) / 100
    const montantTtc = Math.round((montantHt + tva) * 100) / 100
    const res = await fetch('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_facture: numero,
        date_facture:   v.date_vente || new Date().toISOString().split('T')[0],
        montant_ht:     montantHt,
        tva,
        montant_ttc:    montantTtc,
        statut:         'en attente',
      })
    })
    if (res.ok) {
      window.location.href = '/dashboard/client/factures'
    }
  }

  const syncSource = async (source: string, body: any) => {
    setSyncing(source); setSyncResult('')
    const res  = await fetch(`/api/produits/sync/${source}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.success) {
      setSyncResult(`✅ ${data.produitsSynced} produits et ${data.ventesSynced} ventes synchronisés`)
      refreshP(); refreshV()
    } else {
      setSyncResult(`❌ ${data.error}`)
    }
    setSyncing(null)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-1">Produits & Ventes</h1>
          <p className="text-white/40 text-sm">Shopify · WooCommerce · Stripe · Manuel</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal('connecteur')} className="btn-ghost text-sm py-2.5 px-4 gap-2">
            <Zap size={14} /> Connecter une boutique
          </button>
          {tab === 'produits' && (
            <button onClick={openCreateProduit} className="btn-primary">
              <Plus size={16} /> Nouveau produit
            </button>
          )}
          {tab === 'ventes' && (
            <button onClick={() => setShowModal('vente')} className="btn-primary">
              <Plus size={16} /> Nouvelle vente
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Produits actifs</p>
          <p className="font-display text-2xl font-bold text-white">{totalProduits}</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">CA ventes</p>
          <p className="font-display text-2xl font-bold text-green-400">{totalVentes.toLocaleString('fr-FR')}€</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Marge moyenne</p>
          <p className={`font-display text-2xl font-bold ${margeMoyenne >= 30 ? 'text-green-400' : margeMoyenne >= 15 ? 'text-orange-400' : 'text-red-400'}`}>{margeMoyenne}%</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Ventes ce mois</p>
          <p className="font-display text-2xl font-bold text-blue-400">
            {ventes.filter(v => v.date_vente?.startsWith(new Date().toISOString().slice(0, 7))).length}
          </p>
        </div>
      </div>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <div className="card-glass p-5 mb-6 border border-yellow-500/10 bg-yellow-500/3">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">🏆 Best-sellers</p>
          <div className="flex gap-4">
            {bestSellers.map((p, i) => {
              const qty = ventes.filter(v => v.produit_id === p.id).reduce((s, v) => s + v.quantite, 0)
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-yellow-400/60 text-sm font-bold">#{i + 1}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{p.nom}</p>
                    <p className="text-white/30 text-xs">{qty} ventes · {p.taux_marge}% marge</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['produits', 'Produits', Package], ['ventes', 'Ventes', ShoppingCart], ['connecteurs', 'Connecteurs', Zap]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              tab === id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Produits */}
      {tab === 'produits' && (
        loadP ? <div className="text-center py-20 text-white/30 text-sm flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />Chargement...</div>
        : produits.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <Package size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm mb-4">Aucun produit</p>
            <div className="flex gap-3 justify-center">
              <button onClick={openCreateProduit} className="btn-primary text-sm">+ Ajouter manuellement</button>
              <button onClick={() => setShowModal('connecteur')} className="btn-ghost text-sm">Connecter Shopify/WooCommerce</button>
            </div>
          </div>
        ) : (
          <div className="card-glass p-6">
            <div className="flex justify-end mb-4">
              <button onClick={() => exportCSV(produits, 'produits')} className="btn-ghost text-xs py-2 px-3 gap-1.5"><Download size={12} /> Exporter</button>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Produit', 'Catégorie', 'Prix vente', 'Coût', 'Marge', 'Stock', 'Source', ''].map(h => (
                      <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produits.map(p => (
                    <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-white text-xs font-medium">{p.nom}</p>
                          {p.description && <p className="text-white/30 text-xs truncate max-w-[150px]">{p.description}</p>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-white/40 text-xs">{p.categorie || '—'}</td>
                      <td className="py-3 pr-4 text-white text-xs font-medium">{p.prix_vente.toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4 text-white/40 text-xs">{p.cout_revient.toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${p.taux_marge >= 30 ? 'text-green-400' : p.taux_marge >= 15 ? 'text-orange-400' : 'text-red-400'}`}>
                          {p.taux_marge}%
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs ${p.stock <= 5 ? 'text-red-400' : p.stock <= 20 ? 'text-orange-400' : 'text-white/60'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${sourceColors[p.source] || sourceColors.manuel}`}>{p.source}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditProduit(p)} className="text-white/20 hover:text-blue-400 p-1"><Pencil size={13} /></button>
                          <button onClick={() => deleteProduit(p.id)} className="text-white/20 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab Ventes */}
      {tab === 'ventes' && (
        loadV ? <div className="text-center py-20 text-white/30 text-sm flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />Chargement...</div>
        : ventes.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <ShoppingCart size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm mb-4">Aucune vente</p>
            <button onClick={() => setShowModal('vente')} className="btn-primary text-sm">+ Enregistrer une vente</button>
          </div>
        ) : (
          <div className="card-glass p-6">
            <div className="flex justify-end mb-4">
              <button onClick={() => exportCSV(ventes, 'ventes')} className="btn-ghost text-xs py-2 px-3 gap-1.5"><Download size={12} /> Exporter</button>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Produit', 'Date', 'Qté', 'Prix unitaire', 'Total', 'Source', ''].map(h => (
                      <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventes.map(v => (
                    <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="py-3 pr-4 text-white text-xs font-medium">{v.produit_nom}</td>
                      <td className="py-3 pr-4 text-white/40 text-xs">{v.date_vente}</td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{v.quantite}</td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{(v.prix_unitaire||0).toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4 text-green-400 font-semibold text-xs">{(v.total||0).toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${sourceColors[v.source] || sourceColors.manuel}`}>{v.source}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => facturerVente(v)} title="Créer une facture"
                            className="text-white/20 hover:text-green-400 transition-colors p-1">
                            <FileText size={13} />
                          </button>
                          {v.source === 'manuel' && (
                            <button onClick={() => deleteVente(v.id)} className="text-white/20 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab Connecteurs */}
      {tab === 'connecteurs' && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { id: 'shopify',     label: 'Shopify',      color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  desc: 'Sync produits + commandes' },
            { id: 'woocommerce', label: 'WooCommerce',  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', desc: 'Via clés API REST' },
            { id: 'stripe',      label: 'Stripe',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',    desc: 'Déjà connecté — sync auto' },
          ].map(c => (
            <div key={c.id} className={`card-glass p-6 border ${c.bg}`}>
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag size={20} className={c.color} />
                <div>
                  <h3 className="font-medium text-white text-sm">{c.label}</h3>
                  <p className="text-white/30 text-xs">{c.desc}</p>
                </div>
              </div>
              <button onClick={() => { setConnecteurTab(c.id as any); setShowModal('connecteur') }}
                className="btn-ghost w-full justify-center text-xs py-2">
                {c.id === 'stripe' ? 'Synchroniser maintenant' : 'Configurer'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Produit */}
      {showModal === 'produit' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">{editProduit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowModal(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[['nom','Nom *','text','Ex: T-shirt premium'],['description','Description','text','Courte description'],['categorie','Catégorie','text','Ex: Vêtements']].map(([k,l,t,ph]) => (
                <div key={k}>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{l}</label>
                  <input type={t} value={(formP as any)[k]} onChange={e => setFormP({...formP, [k]: e.target.value})}
                    placeholder={ph}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[['prix_vente','Prix vente (€)'],['cout_revient','Coût (€)'],['stock','Stock']].map(([k,l]) => (
                  <div key={k}>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{l}</label>
                    <input type="number" value={(formP as any)[k]} onChange={e => setFormP({...formP, [k]: e.target.value})}
                      placeholder="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
              </div>
              {formP.prix_vente && formP.cout_revient && (
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <p className="text-white/40 text-xs">Marge calculée</p>
                  <p className={`font-display text-lg font-bold ${
                    ((parseFloat(formP.prix_vente) - parseFloat(formP.cout_revient)) / parseFloat(formP.prix_vente) * 100) >= 30
                      ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {Math.round((parseFloat(formP.prix_vente) - parseFloat(formP.cout_revient)) / parseFloat(formP.prix_vente) * 100)}%
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)} className="btn-ghost flex-1 justify-center">Annuler</button>
              <button onClick={saveProduit} disabled={saving || !formP.nom}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} />{editProduit ? 'Modifier' : 'Créer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vente */}
      {showModal === 'vente' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">Nouvelle vente</h2>
              <button onClick={() => setShowModal(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Produit</label>
                <select value={formV.produit_id} onChange={e => {
                  const p = produits.find(x => x.id === e.target.value)
                  setFormV({...formV, produit_id: e.target.value, prix_unitaire: p ? String(p.prix_vente) : formV.prix_unitaire})
                }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="">Saisir manuellement</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {p.prix_vente}€</option>)}
                </select>
              </div>
              {!formV.produit_id && (
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Nom du produit *</label>
                  <input value={formV.produit_nom} onChange={e => setFormV({...formV, produit_nom: e.target.value})}
                    placeholder="Nom du produit"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {[['quantite','Quantité'],['prix_unitaire','Prix unit. (€)'],['date_vente','Date']].map(([k,l]) => (
                  <div key={k}>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{l}</label>
                    <input type={k === 'date_vente' ? 'date' : 'number'} value={(formV as any)[k]} onChange={e => setFormV({...formV, [k]: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
              </div>
              {formV.quantite && formV.prix_unitaire && (
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <p className="text-white/40 text-xs">Total</p>
                  <p className="font-display text-lg font-bold text-green-400">
                    {(parseInt(formV.quantite) * parseFloat(formV.prix_unitaire)).toLocaleString('fr-FR')}€
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)} className="btn-ghost flex-1 justify-center">Annuler</button>
              <button onClick={saveVente} disabled={saving || (!formV.produit_id && !formV.produit_nom) || !formV.prix_unitaire}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Connecteurs */}
      {showModal === 'connecteur' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">Connecter une boutique</h2>
              <button onClick={() => { setShowModal(null); setSyncResult('') }} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-6">
              {(['shopify','woocommerce','stripe'] as const).map(t => (
                <button key={t} onClick={() => setConnecteurTab(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${
                    connecteurTab === t ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50'
                  }`}>{t}</button>
              ))}
            </div>

            {connecteurTab === 'shopify' && (
              <div className="space-y-3">
                <p className="text-white/40 text-xs mb-4">Dans Shopify → Apps → Develop apps → créer une app avec accès <code className="bg-white/10 px-1 rounded">read_products</code> et <code className="bg-white/10 px-1 rounded">read_orders</code></p>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">URL boutique</label>
                  <input value={shopifyForm.shop_url} onChange={e => setShopifyForm({...shopifyForm, shop_url: e.target.value})}
                    placeholder="ma-boutique.myshopify.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Admin API Access Token</label>
                  <input type="password" value={shopifyForm.api_key} onChange={e => setShopifyForm({...shopifyForm, api_key: e.target.value})}
                    placeholder="shpat_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
                <button onClick={() => syncSource('shopify', shopifyForm)} disabled={!!syncing || !shopifyForm.shop_url || !shopifyForm.api_key}
                  className="btn-primary w-full justify-center disabled:opacity-40">
                  {syncing === 'shopify' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap size={14} /> Synchroniser Shopify</>}
                </button>
              </div>
            )}

            {connecteurTab === 'woocommerce' && (
              <div className="space-y-3">
                <p className="text-white/40 text-xs mb-4">Dans WooCommerce → Réglages → Avancé → REST API → Créer une clé avec accès Lecture</p>
                {[['shop_url','URL boutique','https://ma-boutique.fr'],['api_key','Consumer Key','ck_...'],['api_secret','Consumer Secret','cs_...']].map(([k,l,ph]) => (
                  <div key={k}>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{l}</label>
                    <input type={k.includes('secret') ? 'password' : 'text'} value={(wooForm as any)[k]} onChange={e => setWooForm({...wooForm, [k]: e.target.value})}
                      placeholder={ph}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
                <button onClick={() => syncSource('woocommerce', wooForm)} disabled={!!syncing || !wooForm.shop_url || !wooForm.api_key}
                  className="btn-primary w-full justify-center disabled:opacity-40">
                  {syncing === 'woocommerce' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap size={14} /> Synchroniser WooCommerce</>}
                </button>
              </div>
            )}

            {connecteurTab === 'stripe' && (
              <div className="space-y-4">
                <p className="text-white/40 text-sm">Stripe est déjà connecté via votre clé <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">STRIPE_SECRET_KEY</code>.</p>
                <p className="text-white/30 text-xs">La sync va importer vos produits Stripe et les 30 derniers jours de paiements.</p>
                <button onClick={() => syncSource('stripe', {})} disabled={!!syncing}
                  className="btn-primary w-full justify-center disabled:opacity-40">
                  {syncing === 'stripe' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap size={14} /> Synchroniser Stripe maintenant</>}
                </button>
              </div>
            )}

            {syncResult && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${syncResult.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {syncResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
