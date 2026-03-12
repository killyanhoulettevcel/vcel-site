'use client'
import { useState, useEffect } from 'react'
import { Zap, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Fonctionnalités', href: '#workflows' },
    { label: 'Tarifs', href: '#tarifs' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className={`mx-auto max-w-6xl px-6 flex items-center justify-between transition-all duration-300 rounded-2xl ${
        scrolled ? 'bg-[#080c14]/90 backdrop-blur-xl border border-white/5 shadow-xl shadow-black/40 py-3 px-6' : ''
      }`}>
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-base text-white tracking-tight">VCEL</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="text-sm text-white/50 hover:text-white/90 transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm text-white/50 hover:text-white transition-colors font-medium px-4 py-2">
            Connexion
          </a>
          <a href="#tarifs"
            className="text-sm bg-white text-[#080c14] font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-all">
            Démarrer →
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mx-4 mt-2 bg-[#0d1321] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-sm font-medium">
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
            <a href="/login" className="text-white/50 text-sm text-center">Connexion</a>
            <a href="#tarifs" className="bg-white text-[#080c14] font-semibold text-sm text-center py-3 rounded-xl">Démarrer</a>
          </div>
        </div>
      )}
    </nav>
  )
}
