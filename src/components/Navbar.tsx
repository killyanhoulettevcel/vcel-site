'use client'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

const LOGO_SRC = 'data:image/png;base64,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'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open,     setOpen]     = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Fonctionnalités', href: '#workflows' },
    { label: 'Tarifs',          href: '#tarifs' },
    { label: 'FAQ',             href: '#faq' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className={`mx-auto max-w-6xl px-4 sm:px-6 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-md border border-[var(--border)] rounded-2xl py-3 px-5' : ''
      }`}>
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center">
            <img
              src={LOGO_SRC}
              alt="VCEL"
              className="h-12 w-auto"
              style={{ mixBlendMode: 'darken' }}
            />
          </a>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                {l.label}
              </a>
            ))}
          </div>

          {/* CTAs desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="btn-ghost text-sm py-2 px-4">
              Connexion
            </a>
            <a href="#tarifs" className="btn-primary text-sm py-2 px-5 flex items-center gap-2 group">
              Démarrer
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Hamburger mobile */}
          <button onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden mx-4 mt-2 bg-white border border-[var(--border)] rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors">
              {l.label}
            </a>
          ))}
          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
            <a href="/login" className="text-center text-sm text-[var(--text-secondary)] py-2">Connexion</a>
            <a href="#tarifs" className="btn-primary justify-center text-sm py-3">Démarrer →</a>
          </div>
        </div>
      )}
    </nav>
  )
}
