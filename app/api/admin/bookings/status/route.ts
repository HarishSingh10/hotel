import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    const allowedRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (!session || !allowedRoles.includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { bookingId, action } = body // action: 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL'

        let status = 'RESERVED'
        let roomStatus = 'OCCUPIED'

        if (action === 'CHECK_IN') {
            status = 'CHECKED_IN'
            roomStatus = 'OCCUPIED'
        } else if (action === 'CHECK_OUT') {
            status = 'CHECKED_OUT'
            roomStatus = 'CLEANING'
        } else if (action === 'CANCEL') {
            status = 'CANCELLED'
            roomStatus = 'AVAILABLE'
        }

        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: status as any },
            include: { room: true }
        })

        // Also update room status
        await prisma.room.update({
            where: { id: booking.roomId },
            data: { status: roomStatus as any }
        })

        // PRODUCTION MAPPING: If Check-out, auto-create a Housekeeping task
        if (action === 'CHECK_OUT') {
            await prisma.serviceRequest.create({
                data: {
                    propertyId: booking.propertyId,
                    roomId: booking.roomId,
                    guestId: booking.guestId,
                    type: 'HOUSEKEEPING',
                    title: `Clean Room ${booking.room.roomNumber}`,
                    description: `Guest checked out at ${new Date().toLocaleTimeString()}. Standard turnover required.`,
                    priority: 'URGENT',
                    status: 'PENDING',
                    slaMinutes: 30
                }
            })

            // PROACTIVE: Notify relevant staff (Housekeeping)
            const staffUsers = await prisma.user.findMany({
                where: {
                    role: 'STAFF',
                    // ideally we filter by housekeeping department, but role is a good start
                }
            })

            if (staffUsers.length > 0) {
                await prisma.inAppNotification.createMany({
                    data: staffUsers.map(u => ({
                        userId: u.id,
                        title: 'New Service Request',
                        description: `Cleaning required for Room ${booking.room.roomNumber} immediately.`,
                        type: 'TASK',
                        isRead: false
                    }))
                })
            }
        }

        return NextResponse.json(booking)
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
