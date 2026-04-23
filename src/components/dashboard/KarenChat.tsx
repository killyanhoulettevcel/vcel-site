'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { X, Send, Loader, Sparkles, ChevronDown, Minimize2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function KarenChat() {
  const { data: session } = useSession()
  const [open, setOpen]           = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sessionId]               = useState(() => crypto.randomUUID())
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  const userId = (session?.user as any)?.id

  // Scroll bas automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input quand ouvert
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized])

  // Message de bienvenue
  useEffect(() => {
    if (open && messages.length === 0) {
      const nom = session?.user?.name?.split(' ')[0] || 'là'
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Bonjour ${nom} 👋 Je suis Karen, votre assistante VCEL. Je connais votre activité, vos factures et vos leads. Comment puis-je vous aider ?`,
        created_at: new Date().toISOString(),
      }])
    }
  }, [open])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !userId) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/karen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId,
          user_id: userId,
          history: messages.slice(-10), // 10 derniers messages pour le contexte
        }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
        created_at: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Une erreur est survenue. Réessayez dans quelques instants.',
        created_at: new Date().toISOString(),
      }])
    }

    setLoading(false)
  }, [input, loading, userId, sessionId, messages])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!session) return null

  return (
    <>
      {/* Bulle flottante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0D1B2A, #1A2E45)' }}
        >
          <Sparkles size={22} className="text-[#4FC3F7]" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Fenêtre chat */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden transition-all"
          style={{
            width: '360px',
            height: minimized ? '60px' : '520px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0D1B2A, #1A2E45)' }}
            onClick={() => setMinimized(!minimized)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#4FC3F7]/20 border border-[#4FC3F7]/30 flex items-center justify-center">
                <Sparkles size={14} className="text-[#4FC3F7]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">Karen</p>
                <p className="text-[#4FC3F7] text-[10px] mt-0.5">Assistante VCEL • En ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); setMinimized(!minimized) }}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                {minimized ? <ChevronDown size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setOpen(false) }}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-[#4FC3F7]/15 border border-[#4FC3F7]/25 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Sparkles size={10} className="text-[#4FC3F7]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-white rounded-br-sm'
                          : 'text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
                      }`}
                      style={msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #0D1B2A, #1A2E45)' }
                        : { background: 'var(--bg-secondary)' }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-[#4FC3F7]/15 border border-[#4FC3F7]/25 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Sparkles size={10} className="text-[#4FC3F7]" />
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[var(--text-light)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Suggestions rapides */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex gap-2 flex-wrap">
                  {[
                    'Mon CA ce mois',
                    'Factures impayées',
                    'Mes leads chauds',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus() }}
                      className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[#4FC3F7]/40 hover:text-[var(--text-primary)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-[var(--border)] shrink-0">
                <div className="flex gap-2 items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2 focus-within:border-[#4FC3F7]/40 transition-colors">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Posez votre question..."
                    className="flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: input.trim() && !loading ? 'var(--navy)' : 'transparent' }}
                  >
                    {loading
                      ? <Loader size={13} className="text-[var(--text-light)] animate-spin" />
                      : <Send size={13} className={input.trim() ? 'text-white' : 'text-[var(--text-light)]'} />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-light)] text-center mt-2">Karen mémorise vos échanges pour mieux vous connaître</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
