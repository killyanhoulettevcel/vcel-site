import { withAuth } from 'next-auth/middleware'
import { NextResponse, NextRequest } from 'next/server'

// ── Mode maintenance ──────────────────────────────────────────────────────────
// Pour activer : dans Vercel Dashboard → Settings → Environment Variables
// Ajouter MAINTENANCE_MODE = true puis redéployer
// Pour désactiver : supprimer la variable ou mettre false puis redéployer

function maintenanceMiddleware(req: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === 'true'
  const path        = req.nextUrl.pathname

  if (maintenance) {
    // Laisser passer la page maintenance elle-même + assets
    if (
      path.startsWith('/maintenance') ||
      path.startsWith('/_next') ||
      path.startsWith('/favicon') ||
      path.startsWith('/logo') ||
      path.startsWith('/api/health')
    ) {
      return NextResponse.next()
    }
    // Tout le reste → page maintenance
    return NextResponse.redirect(new URL('/maintenance', req.url))
  }

  return null
}

export default withAuth(
  function middleware(req) {
    // Vérifier maintenance en premier
    const maintenanceResponse = maintenanceMiddleware(req)
    if (maintenanceResponse) return maintenanceResponse

    const token = req.nextauth.token
    const path  = req.nextUrl.pathname

    // Route admin → réservée aux admins
    if (path.startsWith('/dashboard/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/client', req.url))
    }

    // Route client → réservée aux clients (les admins peuvent aussi y accéder)
    if (path.startsWith('/dashboard/client') && !['admin', 'client'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // En mode maintenance, tout le monde est autorisé (géré plus haut)
        if (process.env.MAINTENANCE_MODE === 'true') return true
        // Sinon logique normale
        const path = req.nextUrl.pathname
        if (path.startsWith('/dashboard')) return !!token
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}