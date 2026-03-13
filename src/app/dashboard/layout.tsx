'use client'
import { SessionProvider, useSession } from 'next-auth/react'
import Sidebar from '@/components/dashboard/Sidebar'
import Notifications from '@/components/dashboard/Notifications'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        {/* Topbar desktop */}
        <div className="hidden lg:flex h-14 border-b border-white/5 px-6 items-center justify-end gap-3 shrink-0">
          <Notifications />
          <div className="w-px h-5 bg-white/10" />
          <a href="/dashboard/client/parametres"
            className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-bold hover:bg-blue-500/30 transition-all">
            {(session?.user?.name || session?.user?.email || '?').charAt(0).toUpperCase()}
          </a>
        </div>
        {/* Padding-top mobile pour la topbar hamburger */}
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
