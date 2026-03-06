'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Sparkles, Brain, RefreshCw } from 'lucide-react'

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
  "Je me sens seul dans mon business",
]

export default function CoachPage() {
  const { data: session } = useSession()
  const nom = session?.user?.name?.split(' ')[0] || 'toi'

  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Charger données dashboard
  useEffect(() => {
    const load = async () => {
      const safe = async (url: string) => {
        try { const r = await fetch(url); return r.ok ? await r.json() : [] } catch { return [] }
      }
      const [ca, leads, factures, workflows, obj, prix] = await Promise.all([
        safe('/api/ca'), safe('/api/leads'), safe('/api/factures'), safe('/api/workflows'),
        safe('/api/objectifs'), safe('/api/prix')
      ])
      setDashboardData({ ca, leads, factures, workflows, objectifs: obj?.objectifs || [], scorePrix: prix?.score_sante || null, conseilPrix: prix?.conseil_rapide || null })
    }
    load()
  }, [])

  // Message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      const h = new Date().getHours()
      const salut = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
      setMessages([{
        role: 'assistant',
        content: `${salut} ${nom} 👋\n\nJe suis ton coach business personnel. Je connais tes chiffres et tes objectifs — mais surtout, je suis là pour toi.\n\nL'entrepreneuriat peut être solitaire. Ici, pas de jugement. Parle-moi de où tu en es, ce qui te pèse, ce qui te motive. Ou pose-moi simplement une question sur ton business.\n\nComment tu vas aujourd'hui ?`,
        ts: new Date()
      }])
    }
  }, [nom])

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
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          dashboardData,
          userName: nom,
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.error || 'Erreur de connexion',
        ts: new Date()
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Désolé, je n\'arrive pas à me connecter. Vérifie ta clé OPENAI_API_KEY dans .env.local.',
        ts: new Date()
      }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const reset = () => setMessages([])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center">
            <Brain size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-sm">Coach IA</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-white/30 text-xs">Disponible 24h/24 · GPT-4o mini</p>
            </div>
          </div>
        </div>
        <button onClick={reset} className="btn-ghost text-xs py-2 px-3 gap-1.5">
          <RefreshCw size={12} /> Nouvelle conversation
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={13} className="text-purple-400" />
              </div>
            )}
            <div className={`max-w-lg ${m.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm ml-12'
                  : 'bg-white/5 border border-white/8 text-white/85 rounded-bl-sm'
              }`}>
                {m.content}
              </div>
              <p className={`text-white/20 text-xs mt-1.5 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {m.ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={13} className="text-purple-400" />
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-8 pb-4 shrink-0">
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-8 pb-6 shrink-0">
        <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-blue-500/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écris ici... (Entrée pour envoyer)"
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none resize-none max-h-32"
            style={{ fieldSizing: 'content' } as any}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              input.trim() && !loading
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-white/15 text-xs text-center mt-2">Shift+Entrée pour saut de ligne</p>
      </div>
    </div>
  )
}
