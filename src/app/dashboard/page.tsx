'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Zap } from 'lucide-react'

export default function DashboardRouter() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    const role = (session.user as any)?.role
    router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/client')
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="flex items-center gap-3 text-white/40">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center animate-pulse">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="text-sm">Chargement...</span>
      </div>
    </div>
  )
}
