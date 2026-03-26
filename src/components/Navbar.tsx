'use client'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

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
              src="/logo.png"
              alt="VCEL"
              className="h-12 w-auto"
              width={48}
              height={48}
              style={{ mixBlendMode: 'darken' }}
              fetchPriority="high"
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