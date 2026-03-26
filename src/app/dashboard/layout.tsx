'use client'
import { SessionProvider, useSession } from 'next-auth/react'
import Sidebar from '@/components/dashboard/Sidebar'
import Notifications from '@/components/dashboard/Notifications'
import { Bell, Settings } from 'lucide-react'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const nom = session?.user?.name || session?.user?.email || '?'

  return (
    <div className="flex min-h-screen bg-cream-100">
      <Sidebar />
      {/* overflow-visible sur ce wrapper pour que le panneau notifications ne soit pas coupé */}
      <div className="flex-1 flex flex-col min-w-0" style={{ overflow: 'visible' }}>
        {/* Topbar desktop — position sticky pour rester visible au scroll */}
        <div className="hidden lg:flex h-14 topbar px-6 items-center justify-end gap-3 shrink-0 sticky top-0"
          style={{ zIndex: 100, overflow: 'visible' }}>
          <Notifications />
          <div className="w-px h-5 bg-[var(--border)]" />
          <a href="/dashboard/client/parametres"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
            <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-bold">
              {nom.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)]">{nom.split(' ')[0]}</span>
          </a>
        </div>
        <main className="flex-1 overflow-auto pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}