import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    const allowedRoles = ['STAFF', 'MANAGER', 'RECEPTIONIST', 'HOTEL_ADMIN', 'SUPER_ADMIN']
    if (!session || !allowedRoles.includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = params

        // Verify task belongs to staff
        const task = await prisma.serviceRequest.findUnique({
            where: { id },
            include: { assignedTo: true }
        })

        if (!task) return new NextResponse('Task not found', { status: 404 })

        // Check if assigned to current user's staff profile
        const staff = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })

        if (task.assignedToId !== staff?.id) {
            return new NextResponse('Not assigned to you', { status: 403 })
        }

        // Update Status
        const updated = await prisma.serviceRequest.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                // could add Calculate SLA logic here
            }
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
