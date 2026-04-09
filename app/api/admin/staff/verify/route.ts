import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { staffId, action } = body // action: 'APPROVE' | 'REJECT'

        if (!staffId || !action) {
            return NextResponse.json({ error: 'Missing staffId or action' }, { status: 400 })
        }

        const staff = await prisma.staff.update({
            where: { id: staffId },
            data: {
                isVerified: action === 'APPROVE',
                verificationRequested: false
            }
        })

        return NextResponse.json({ success: true, staff })
    } catch (error) {
        console.error("Admin Staff Verify API Error:", error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
