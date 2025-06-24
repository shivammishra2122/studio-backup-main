import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'
    const isLoginPage = request.nextUrl.pathname === '/login'

    if (!isAuthenticated && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthenticated && isLoginPage) {
        return NextResponse.redirect(new URL('/patients', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login.png).*)'],
}