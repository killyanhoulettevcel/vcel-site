'use client'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Activity, Settings, LogOut,
  Shield, ChevronRight, Rocket, Brain, Euro, Calculator, Target, Upload,
  CalendarDays, ShoppingBag, Zap, Menu, X, Bell
} from 'lucide-react'

interface NavItem { label: string; href: string; icon: React.ElementType; adminOnly?: boolean }

const navGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard',        href: '/dashboard/client',             icon: LayoutDashboard },
      { label: 'Démarrage',        href: '/dashboard/client/onboarding',  icon: Rocket },
    ]
  },
  {
    label: 'Finances',
    items: [
      { label: 'CA & Finances',    href: '/dashboard/client/finances',    icon: Activity },
      { label: 'Factures',         href: '/dashboard/client/factures',    icon: FileText },
      { label: 'Produits & Ventes',href: '/dashboard/client/produits',    icon: ShoppingBag },
    ]
  },
  {
    label: 'Commercial',
    items: [
      { label: 'Leads CRM',        href: '/dashboard/client/leads',       icon: Users },
      { label: 'Agenda',           href: '/dashboard/client/agenda',      icon: CalendarDays },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Coach IA',         href: '/dashboard/client/coach',       icon: Brain },
      { label: 'Workflows',        href: '/dashboard/client/workflows',   icon: Zap },
      { label: 'Suggestions prix', href: '/dashboard/client/prix',        icon: Euro },
      { label: 'Rentabilité',      href: '/dashboard/client/rentabilite', icon: Calculator },
      { label: 'Objectifs',        href: '/dashboard/client/objectifs',   icon: Target },
    ]
  },
  {
    label: 'Outils',
    items: [
      { label: 'Importer CSV',     href: '/dashboard/client/import',      icon: Upload },
    ]
  },
]

const adminItem = { label: 'Vue globale', href: '/dashboard/admin', icon: Shield }

const LOGO_SRC = 'data:image/png;base64,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'

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)
  const role = (session?.user as any)?.role
  const nom  = session?.user?.name || 'Client'
  const email = session?.user?.email || ''

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-[var(--border)]">
        <a href="/" className="flex items-center gap-2.5">
          <img src={LOGO_SRC} alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: "multiply" }} />
        </a>
        <button onClick={() => setOpen(false)} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
          <X size={18} />
        </button>
      </div>

      {/* Profil */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)]">
          <div className="w-8 h-8 rounded-full bg-gradient-navy flex items-center justify-center text-white text-sm font-bold shrink-0">
            {nom.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-primary)] text-sm font-semibold truncate">{nom}</p>
            <p className="text-[var(--text-muted)] text-xs truncate">{email}</p>
          </div>
          {role === 'admin' && (
            <span className="text-xs bg-[var(--navy)] text-white px-1.5 py-0.5 rounded-md font-semibold">Admin</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {role === 'admin' && (
          <div>
            <a href={adminItem.href} onClick={() => setOpen(false)}
              className={`nav-item ${pathname === adminItem.href ? 'active' : ''}`}>
              <adminItem.icon size={15} />
              {adminItem.label}
            </a>
          </div>
        )}
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="section-label px-3 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                  <item.icon size={15} />
                  {item.label}
                  {pathname === item.href && <ChevronRight size={13} className="ml-auto opacity-50" />}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bas */}
      <div className="px-3 py-4 border-t border-[var(--border)] space-y-0.5">
        <a href="/dashboard/client/parametres" onClick={() => setOpen(false)}
          className={`nav-item ${pathname === '/dashboard/client/parametres' ? 'active' : ''}`}>
          <Settings size={15} /> Paramètres
        </a>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="nav-item w-full text-left hover:!bg-red-50 hover:!text-red-600">
          <LogOut size={15} /> Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 topbar flex items-center justify-between px-4">
        <a href="/" className="flex items-center">
          <img src={LOGO_SRC} alt="VCEL" className="h-6 w-auto" style={{ mixBlendMode: "multiply" }} />
        </a>
        <button onClick={() => setOpen(true)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
          <Menu size={20} />
        </button>
      </div>

      {/* Overlay mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] sidebar h-full shadow-xl-navy">
            <NavContent />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 min-h-screen sidebar flex-col shrink-0">
        <NavContent />
      </aside>
    </>
  )
}