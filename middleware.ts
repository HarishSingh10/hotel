import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
    const token = await getToken({ req })
    const isAuth = !!token
    const { pathname } = req.nextUrl

    const isPublicPage = pathname === '/'
    const isAuthPage =
        pathname.startsWith('/admin/login') ||
        pathname.startsWith('/admin/register') ||
        pathname.startsWith('/admin/forgot-password') ||
        pathname.startsWith('/receptionist/login') ||
        pathname.startsWith('/staff/login')

    // 1. Allow public pages through
    if (isPublicPage) {
        return NextResponse.next()
    }

    const getHomePath = (role: string) => {
        if (role === 'STAFF') return '/staff'
        if (['HOTEL_ADMIN', 'MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(role)) return '/admin/dashboard'
        return '/'
    }

    // 2. If logged in, don't allow visiting auth pages
    if (isAuthPage && isAuth) {
        return NextResponse.redirect(new URL(getHomePath(token.role as string), req.url))
    }

    // 3. Unauthenticated users trying to access protected paths
    if (!isAuth && !isAuthPage) {
        // Only redirect if specifically matching our protected prefixes
        const isProtectedPath = pathname.startsWith('/admin') || pathname.startsWith('/staff') || pathname.startsWith('/receptionist')
        
        if (isProtectedPath) {
            let loginPath = '/admin/login'
            if (pathname.startsWith('/staff')) loginPath = '/staff/login'
            return NextResponse.redirect(new URL(loginPath, req.url))
        }
    }

    // 4. Role-based access for authenticated users
    if (isAuth) {
        const role = token.role as string

        // Protection for /admin paths
        if (pathname.startsWith('/admin') && !isAuthPage) {
            const allowedAdminRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
            if (!allowedAdminRoles.includes(role)) {
                return NextResponse.redirect(new URL(getHomePath(role), req.url))
            }
            // Payroll specific
            if (pathname.startsWith('/admin/payroll') && !['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(role)) {
                return NextResponse.redirect(new URL('/admin/dashboard', req.url))
            }
        }

        // Protection for /staff paths
        if (pathname.startsWith('/staff') && !isAuthPage) {
            const allowedStaffRoles = ['STAFF', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
            if (!allowedStaffRoles.includes(role)) {
                return NextResponse.redirect(new URL(getHomePath(role), req.url))
            }
        }
        
        // Handle base paths /admin and /staff
        const homePath = getHomePath(role)
        if ((pathname === '/admin' || pathname === '/staff') && pathname !== homePath) {
            return NextResponse.redirect(new URL(homePath, req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ]
}
