import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

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
      authorized: ({ token }) => !!token, // connecté = autorisé
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
