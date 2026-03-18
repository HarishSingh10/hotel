import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const notifications = await prisma.inAppNotification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error("Notifications API Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await request.json()
        const { id, isRead } = body

        if (id) {
            const updated = await prisma.inAppNotification.update({
                where: { id },
                data: { isRead }
            })
            return NextResponse.json(updated)
        } else {
            // Mark all as read
            await prisma.inAppNotification.updateMany({
                where: { userId: session.user.id },
                data: { isRead: true }
            })
            return NextResponse.json({ success: true })
        }
    } catch (error) {
        console.error("Notifications PATCH Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
