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
    { label: 'Workflows', href: '#workflows' },
    { label: 'Tarifs', href: '#tarifs' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Espace client', href: '/login' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'py-3' : 'py-5'
    }`}>
      <div className={`mx-auto max-w-6xl px-6 flex items-center justify-between rounded-2xl transition-all duration-500 ${
        scrolled ? 'bg-navy-900/80 backdrop-blur-xl border border-white/5 shadow-2xl' : ''
      }`} style={scrolled ? { padding: '12px 24px' } : {}}>

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:shadow-blue-500/60 transition-all">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="font-display font-800 text-lg text-white tracking-tight">VCEL</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="text-sm text-white/60 hover:text-white transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="btn-ghost text-sm py-2.5 px-5">Espace client</a>
          <a href="#contact" className="btn-primary text-sm py-2.5 px-5">
            Démarrer <span className="text-blue-200 text-xs font-normal">→</span>
          </a>
        </div>

        {/* Mobile */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mx-6 mt-2 card-glass p-6 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-sm font-medium">
              {l.label}
            </a>
          ))}
          <a href="#contact" className="btn-primary text-sm justify-center">Démarrer maintenant</a>
        </div>
      )}
    </nav>
  )
}
