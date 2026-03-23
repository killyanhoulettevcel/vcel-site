'use client'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Activity, Settings, LogOut,
  Shield, ChevronRight, Rocket, Brain, Euro, Calculator, Target, Upload,
  CalendarDays, ShoppingBag, Zap, Menu, X, Bell, HeartPulse
} from 'lucide-react'

interface NavItem { label: string; href: string; icon: React.ElementType; adminOnly?: boolean }

const navGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard',        href: '/dashboard/client',             icon: LayoutDashboard },
      { label: 'Démarrage',        href: '/dashboard/client/onboarding',  icon: Rocket },
      { label: 'Score santé',      href: '/dashboard/client/score',       icon: HeartPulse },
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
          <img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'darken' }}  />
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
            <span className="text-xs bg-cyan-100 text-cyan-800 border border-cyan-200 px-1.5 py-0.5 rounded-md font-semibold">Admin</span>
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
          <img src="/logo.png" alt="VCEL" className="h-6 w-auto" style={{ mixBlendMode: 'darken' }}  />
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