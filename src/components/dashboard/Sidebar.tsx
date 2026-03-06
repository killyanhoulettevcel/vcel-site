'use client'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  Zap, LayoutDashboard, FileText, Users,
  Activity, Settings, LogOut, Shield, ChevronRight, Rocket, Brain, Euro, Calculator, Target
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Vue globale',    href: '/dashboard/admin',           icon: Shield,          adminOnly: true },
  { label: 'Mon dashboard',  href: '/dashboard/client',          icon: LayoutDashboard },
  { label: 'Démarrage',       href: '/dashboard/client/onboarding', icon: Rocket },
  { label: 'CA & Finances',  href: '/dashboard/client/finances', icon: Activity },
  { label: 'Factures',       href: '/dashboard/client/factures', icon: FileText },
  { label: 'Leads CRM',      href: '/dashboard/client/leads',    icon: Users },
  { label: 'Workflows',      href: '/dashboard/client/workflows',icon: Zap },
  { label: 'Coach IA',        href: '/dashboard/client/coach',     icon: Brain },
  { label: 'Suggestions prix', href: '/dashboard/client/prix',      icon: Euro },
  { label: 'Rentabilité',      href: '/dashboard/client/rentabilite', icon: Calculator },
  { label: 'Objectifs',        href: '/dashboard/client/objectifs',   icon: Target },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as any)?.role
  const nom = session?.user?.name || 'Client'

  const items = navItems.filter(i => !i.adminOnly || role === 'admin')

  return (
    <aside className="w-64 min-h-screen bg-navy-900 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap size={15} fill="white" className="text-white" />
          </div>
          <span className="font-display font-bold text-white">VCEL</span>
        </a>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-bold">
            {nom.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{nom}</p>
            <p className="text-white/30 text-xs">{role === 'admin' ? '👑 Admin' : '👤 Client'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <a key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}>
              <item.icon size={16} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </a>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <a href="/dashboard/client/profil"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            pathname === '/dashboard/client/profil'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}>
          <Settings size={16} />
          Mon profil
        </a>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
