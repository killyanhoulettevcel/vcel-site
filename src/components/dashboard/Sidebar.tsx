'use client'
import { useState, useEffect, useRef } from 'react'
import { PLAN_GATES } from '@/lib/usePlan'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Activity, Settings, LogOut,
  Shield, ChevronRight, ChevronDown, Rocket, Brain, Euro, Calculator,
  Target, Upload, Bell, Receipt, CalendarDays, ShoppingBag, Zap,
  Menu, X, HeartPulse, Landmark, BookTemplate, BarChart2, Lock
} from 'lucide-react'

// ─── Structure ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: boolean
}

interface NavGroup {
  id: string
  label: string
  icon: React.ElementType   // icône représentant le groupe (affichée quand replié)
  defaultOpen?: boolean
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: 'Dashboard',    href: '/dashboard/client',           icon: LayoutDashboard },
      { label: 'Alertes IA',   href: '/dashboard/client/alertes',   icon: Bell, badge: true },
      { label: 'Score santé',  href: '/dashboard/client/score',     icon: HeartPulse },
      { label: 'Démarrage',    href: '/dashboard/client/onboarding', icon: Rocket },
    ],
  },
  {
    id: 'facturation',
    label: 'Facturation',
    icon: FileText,
    defaultOpen: false,
    items: [
      { label: 'Factures',          href: '/dashboard/client/factures',   icon: FileText },
      { label: 'Devis',             href: '/dashboard/client/devis',      icon: BookTemplate },
      { label: 'Avoirs',            href: '/dashboard/client/avoirs',     icon: Landmark },
      { label: 'Acomptes',          href: '/dashboard/client/acomptes',   icon: Euro },
      { label: 'Simulateur fiscal', href: '/dashboard/client/simulateur', icon: Receipt },
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: Activity,
    defaultOpen: false,
    items: [
      { label: 'CA & Revenus',      href: '/dashboard/client/finances',    icon: Activity },
      { label: 'Produits & Ventes', href: '/dashboard/client/produits',    icon: ShoppingBag },
      { label: 'Rentabilité',       href: '/dashboard/client/rentabilite', icon: BarChart2 },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: Users,
    defaultOpen: false,
    items: [
      { label: 'Leads CRM', href: '/dashboard/client/leads',  icon: Users },
      { label: 'Agenda',    href: '/dashboard/client/agenda', icon: CalendarDays },
    ],
  },
  {
    id: 'automatisation',
    label: 'Automatisation',
    icon: Zap,
    defaultOpen: false,
    items: [
      { label: 'Coach IA',         href: '/dashboard/client/coach',       icon: Brain },
      { label: 'Workflows',        href: '/dashboard/client/workflows',   icon: Zap },
      { label: 'Objectifs',        href: '/dashboard/client/objectifs',   icon: Target },
      { label: 'Suggestions prix', href: '/dashboard/client/prix',        icon: Euro },
    ],
  },
  {
    id: 'outils',
    label: 'Outils',
    icon: Upload,
    defaultOpen: false,
    items: [
      { label: 'Importer CSV', href: '/dashboard/client/import',      icon: Upload },
      { label: 'Paramètres',   href: '/dashboard/client/parametres',  icon: Settings },
    ],
  },
]

const adminItem: NavItem = { label: 'Vue globale', href: '/dashboard/admin', icon: Shield }

// ─── Tooltip flottant ─────────────────────────────────────────────────────────

function GroupTooltip({ group, anchorRef, visible }: {
  group: NavGroup
  anchorRef: React.RefObject<HTMLElement>
  visible: boolean
}) {
  const [pos, setPos] = useState({ top: 0 })

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.top + rect.height / 2 })
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: 264, top: pos.top, transform: 'translateY(-50%)' }}
    >
      <div
        className="rounded-xl shadow-lg py-2 min-w-[160px]"
        style={{
          background: 'white',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Flèche */}
        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
          style={{ background: 'white', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />

        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>
          {group.label}
        </p>
        {group.items.map(item => (
          <div key={item.href} className="flex items-center gap-2 px-3 py-1.5 text-xs"
            style={{ color: 'var(--text-secondary)' }}>
            <item.icon size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Groupe dépliant ──────────────────────────────────────────────────────────

function NavGroupItem({
  group, pathname, nbCritiques, onNavigate, userPlan,
}: {
  group: NavGroup
  pathname: string
  nbCritiques: number
  onNavigate: () => void
  userPlan: string
}) {
  const isActiveGroup = group.items.some(i => pathname.startsWith(i.href) && i.href !== '/dashboard/client' || pathname === i.href)
  const [open, setOpen] = useState(group.defaultOpen || isActiveGroup)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const headerRef = useRef<HTMLButtonElement>(null)

  // Ouvrir automatiquement si on navigue dans ce groupe
  useEffect(() => {
    if (isActiveGroup) setOpen(true)
  }, [isActiveGroup])

  const GIcon = group.icon

  return (
    <div>
      {/* En-tête du groupe */}
      <button
        ref={headerRef}
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => !open && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group/header"
        style={{
          background: isActiveGroup && !open ? 'rgba(79,195,247,0.08)' : 'transparent',
        }}
      >
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 flex items-center justify-center transition-colors`}>
            <GIcon size={14} style={{
              color: isActiveGroup ? 'var(--cyan-dark)' : 'var(--text-muted)',
            }} />
          </div>
          <span
            className="text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ color: isActiveGroup ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {group.label}
          </span>
        </div>
        <div
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown size={12} style={{ color: 'var(--text-light)' }} />
        </div>
      </button>

      {/* Tooltip quand replié */}
      <GroupTooltip
        group={group}
        anchorRef={headerRef as React.RefObject<HTMLElement>}
        visible={tooltipVisible}
      />

      {/* Items dépliants */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? `${group.items.length * 44}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="mt-0.5 ml-2 pl-3 space-y-0.5 border-l"
          style={{ borderColor: 'var(--border)' }}>
          {group.items.map(item => {
            const isActive = item.href === '/dashboard/client'
              ? pathname === item.href
              : pathname.startsWith(item.href)

            // Détecter si la feature est locked pour ce plan
            const featureKey = item.href.split('/').pop() || ''
            const requiredPlan = PLAN_GATES[featureKey]
            const isLocked = requiredPlan && userPlan !== 'pro' && userPlan !== 'business'

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'var(--navy)' : 'transparent',
                  color: isLocked ? 'var(--text-light)' : isActive ? 'white' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 8px rgba(13,27,42,0.15)' : 'none',
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <item.icon size={13} style={{
                  color: isLocked ? 'var(--text-light)' : isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                  flexShrink: 0,
                }} />
                <span className="flex-1 truncate">{item.label}</span>

                {/* Badge lock */}
                {isLocked && (
                  <Lock size={9} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                )}

                {/* Badge alertes critiques */}
                {item.badge && nbCritiques > 0 && !isLocked && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: '#EF4444' }}
                  >
                    {nbCritiques}
                  </span>
                )}

                {/* Chevron si actif */}
                {isActive && !item.badge && !isLocked && (
                  <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                )}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar principale ───────────────────────────────────────────────────────

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname  = usePathname()
  const [open, setOpen]           = useState(false)
  const [nbCritiques, setNbCritiques] = useState(0)

  const role  = (session?.user as any)?.role
  const plan  = (session?.user as any)?.plan || 'starter'
  const nom   = session?.user?.name  || 'Client'
  const email = session?.user?.email || ''

  useEffect(() => {
    fetch('/api/alertes')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats?.critique) setNbCritiques(d.stats.critique) })
      .catch(() => {})
  }, [pathname])

  const NavContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--border)' }}>
        <a href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'darken' }} />
        </a>
        <button onClick={() => setOpen(false)}
          className="lg:hidden p-1 rounded-lg"
          style={{ color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Profil */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--bg-secondary)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'var(--navy)' }}>
            {nom.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{nom}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{email}</p>
          </div>
          {role === 'admin' ? (
            <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
              style={{ background: 'rgba(79,195,247,0.15)', color: 'var(--cyan-dark)' }}>
              Admin
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold capitalize"
              style={{ background: 'rgba(13,27,42,0.06)', color: 'var(--text-muted)' }}>
              {plan}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">

        {/* Admin */}
        {role === 'admin' && (
          <a href={adminItem.href} onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium mb-2 transition-all"
            style={{
              background: pathname === adminItem.href ? 'var(--navy)' : 'rgba(79,195,247,0.06)',
              color: pathname === adminItem.href ? 'white' : 'var(--cyan-dark)',
              border: '1px solid rgba(79,195,247,0.20)',
            }}>
            <Shield size={13} />
            Vue globale
          </a>
        )}

        {/* Groupes */}
        {NAV_GROUPS.map(group => (
          <NavGroupItem
            key={group.id}
            group={group}
            pathname={pathname}
            nbCritiques={nbCritiques}
            onNavigate={() => setOpen(false)}
            userPlan={plan}
          />
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium w-full transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF2F2'
            e.currentTarget.style.color = '#DC2626'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 topbar flex items-center justify-between px-4">
        <a href="/">
          <img src="/logo.png" alt="VCEL" className="h-6 w-auto" style={{ mixBlendMode: 'darken' }} />
        </a>
        <button onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <Menu size={20} />
        </button>
      </div>

      {/* Overlay mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] sidebar h-full shadow-xl">
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden lg:flex w-64 min-h-screen sidebar flex-col shrink-0">
        <NavContent />
      </aside>
    </>
  )
}