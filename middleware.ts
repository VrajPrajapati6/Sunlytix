import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;

    const protectedRoutes = ['/dashboard', '/settings', '/inverters', '/insights', '/assistant'];
    const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Redirect root path to dashboard if logged in, else login
    if (req.nextUrl.pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        } else {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/dashboard', '/settings', '/inverters/:path*', '/insights/:path*', '/assistant/:path*'],
};
