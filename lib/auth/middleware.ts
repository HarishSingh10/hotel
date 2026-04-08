import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'

export interface AuthUser {
    id: string
    email: string
    role: string
    propertyId?: string | null
    department?: string | null
}

/**
 * Verify JWT token and return user info
 */
export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
    try {
        const authHeader = req.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }

        const token = authHeader.substring(7)

        const decoded = verify(token, JWT_SECRET) as AuthUser

        // Optionally verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, status: true, workplaceId: true }
        })

        if (!user || user.status !== 'ACTIVE') {
            return null
        }

        return {
            id: decoded.id,
            email: decoded.email,
            role: user.role,
            propertyId: user.workplaceId
        }
    } catch (error) {
        console.error('[AUTH_VERIFY_ERROR]', error)
        return null
    }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole)
}

import { getServerSession } from 'next-auth'
import { authOptions } from './options'

/**
 * Middleware to require authentication (supports both JWT header and NextAuth session)
 */
export async function requireAuth(
    req: NextRequest,
    allowedRoles?: string[]
): Promise<{ user: AuthUser } | NextResponse> {

    // 1. Try NextAuth session (for Admin/Web)
    const session = await getServerSession(authOptions)
    if (session?.user) {
        const user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            propertyId: session.user.propertyId,
            department: session.user.department
        } as AuthUser

        if (allowedRoles && !hasRole(user.role, allowedRoles)) {
            return NextResponse.json(
                { error: 'Forbidden. Insufficient permissions.' },
                { status: 403 }
            )
        }
        return { user }
    }

    // 2. Fallback to JWT Header (for Mobile App)
    const user = await verifyAuth(req)

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized. Please login.' },
            { status: 401 }
        )
    }

    // Check role if specified
    if (allowedRoles && !hasRole(user.role, allowedRoles)) {
        return NextResponse.json(
            { error: 'Forbidden. Insufficient permissions.' },
            { status: 403 }
        )
    }

    return { user }
}

/**
 * Helper to get auth user or return error response
 */
export async function getAuthUser(
    req: NextRequest,
    allowedRoles?: string[]
): Promise<AuthUser | null> {
    const result = await requireAuth(req, allowedRoles)

    if (result instanceof NextResponse) {
        return null
    }

    return result.user
}
