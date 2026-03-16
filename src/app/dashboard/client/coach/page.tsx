'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Sparkles, Brain, RefreshCw, Calendar } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: Date
}

const suggestions = [
  "Comment je me sens en ce moment ?",
  "Analyse mes chiffres du mois",
  "J'ai l'impression de stagner...",
  "Qu'est-ce que je devrais prioriser ?",
  "Célèbre mes victoires avec moi 🎉",
  "Que disent mes RDV d'aujourd'hui ?",
]

export default function CoachPage() {
  const { data: session } = useSession()
  const nom = session?.user?.name?.split(' ')[0] || 'toi'

  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [rdvCount, setRdvCount]           = useState(0)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const load = async () => {
      const safe = async (url: string) => {
        try { const r = await fetch(url); return r.ok ? await r.json() : [] } catch { return [] }
      }
      const [ca, leads, factures, workflows, obj, prix, rdv, produits, ventes] = await Promise.all([
        safe('/api/ca'), safe('/api/leads'), safe('/api/factures'),
        safe('/api/workflows'), safe('/api/objectifs'), safe('/api/prix'),
        safe('/api/calendar/today'), safe('/api/produits'), safe('/api/ventes'),
      ])
      setDashboardData({
        ca, leads, factures, workflows, produits, ventes,
        objectifs: obj?.objectifs || [],
        scorePrix: prix?.score_sante || null,
        conseilPrix: prix?.conseil_rapide || null,
        rdvAujourdhui: Array.isArray(rdv) ? rdv : [],
      })
      setRdvCount(Array.isArray(rdv) ? rdv.length : 0)
    }
    load()
  }, [])

  useEffect(() => {
    if (messages.length === 0) {
      const h = new Date().getHours()
      const salut = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
      const rdvLine = rdvCount > 0
        ? `\n\nJe vois que tu as **${rdvCount} RDV** aujourd'hui.`
        : ''
      setMessages([{
        role: 'assistant',
        content: `${salut} ${nom} 👋\n\nJe suis ton coach business personnel. Je connais tes chiffres, tes objectifs et ton agenda.${rdvLine}\n\nComment tu vas aujourd'hui ?`,
        ts: new Date()
      }])
    }
  }, [nom, rdvCount])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return
    const userMsg: Message = { role: 'user', content, ts: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res  = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), dashboardData, userName: nom })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Erreur', ts: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, erreur de connexion.', ts: new Date() }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center">
            <Brain size={16} className="text-purple-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-[var(--text-primary)] text-sm">Coach IA</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[var(--text-muted)] text-xs hidden sm:block">Disponible 24h/24 · GPT-4o mini</p>
              <p className="text-[var(--text-muted)] text-xs sm:hidden">En ligne</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rdvCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">
              <Calendar size={12} />
              <span className="hidden sm:inline">{rdvCount} RDV aujourd'hui</span>
              <span className="sm:hidden">{rdvCount} RDV</span>
            </div>
          )}
          <button onClick={() => setMessages([])} className="btn-ghost text-xs py-2 px-2 md:px-3 gap-1.5">
            <RefreshCw size={12} />
            <span className="hidden sm:inline">Nouvelle conversation</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 md:gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-purple-400" />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-lg ${m.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm ml-8 md:ml-12'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm'
              }`}>
                {m.content}
              </div>
              <p className={`text-[var(--text-muted)] text-xs mt-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {m.ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 md:gap-3 justify-start">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-purple-400" />
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 md:px-8 pb-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs px-3 py-1.5 md:py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 md:px-8 pb-4 md:pb-6 shrink-0">
        <div className="flex items-end gap-2 md:gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:border-blue-500/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écris ici..."
            rows={1}
            className="flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none resize-none max-h-32"
            style={{ fieldSizing: 'content' } as any}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              input.trim() && !loading ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
            }`}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-[var(--text-muted)] text-xs text-center mt-1.5 hidden md:block">Shift+Entrée pour saut de ligne</p>
      </div>
    </div>
  )
}