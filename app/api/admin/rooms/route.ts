import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const queryPropertyId = searchParams.get('propertyId')

    const where: any = {}

    // RBAC: If Super Admin, they can filter by any property or see all. 
    // Otherwise, they are locked to their own property.
    if (session.user.role === 'SUPER_ADMIN') {
        if (queryPropertyId && queryPropertyId !== 'ALL') {
            where.propertyId = queryPropertyId
        }
    } else {
        const propertyId = session.user.propertyId
        if (propertyId) where.propertyId = propertyId
    }
    if (status && status !== 'ALL') where.status = status as any

    try {
        const rooms = await prisma.room.findMany({
            where,
            include: {
                bookings: {
                    where: {
                        status: { in: ['CHECKED_IN', 'RESERVED'] }
                    },
                    select: {
                        id: true,
                        status: true,
                        checkIn: true,
                        checkOut: true,
                        guest: { select: { name: true } }
                    }
                }
            },
            orderBy: { roomNumber: 'asc' }
        })

        // Auto-correct mis-synchronized statuses
        const now = new Date()
        const syncedRooms = await Promise.all(rooms.map(async (room) => {
            const hasActiveBooking = room.bookings.some(b => b.status === 'CHECKED_IN');

            // If room is marked OCCUPIED but has no active CHECKED_IN booking right now, set it back to AVAILABLE
            if (room.status === 'OCCUPIED' && !hasActiveBooking) {
                await prisma.room.update({
                    where: { id: room.id },
                    data: { status: 'AVAILABLE' }
                });
                return { ...room, status: 'AVAILABLE' };
            }

            // If room is AVAILABLE but HAS an active CHECKED_IN booking, set it to OCCUPIED
            if (room.status === 'AVAILABLE' && hasActiveBooking) {
                await prisma.room.update({
                    where: { id: room.id },
                    data: { status: 'OCCUPIED' }
                });
                return { ...room, status: 'OCCUPIED' };
            }

            return room;
        }));

        return NextResponse.json(syncedRooms)
    } catch (error) {
        console.error('Room fetch error:', error);
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { roomNumber, floor, category, type, basePrice, maxOccupancy, propertyId: bodyPropertyId } = body

        let propertyId = session.user.propertyId
        if (session.user.role === 'SUPER_ADMIN' && bodyPropertyId) {
            propertyId = bodyPropertyId
        }

        if (!propertyId) return new NextResponse('No property associated with account or provided', { status: 400 })

        const room = await prisma.room.create({
            data: {
                propertyId: propertyId,
                roomNumber,
                floor: parseInt(floor),
                category,
                type,
                basePrice: parseFloat(basePrice.toString()),
                maxOccupancy: parseInt(maxOccupancy.toString()) || 2,
                status: 'AVAILABLE',
                images: body.images || []
            }
        })

        return NextResponse.json(room)
    } catch (error: any) {
        console.error(error)
        if (error.code === 'P2002') return new NextResponse('Room number already exists', { status: 400 })
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
