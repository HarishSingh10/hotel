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
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const where: any = {}
    if (session.user.role === 'SUPER_ADMIN') {
        if (queryPropertyId && queryPropertyId !== 'ALL') {
            where.propertyId = queryPropertyId
        }
    } else {
        const propertyId = session.user.propertyId
        if (propertyId) where.propertyId = propertyId
    }
    if (status && status !== 'ALL') where.status = status as any
    const roomType = searchParams.get('type')
    if (roomType && roomType !== 'ALL') where.type = roomType as any

    try {
        const rooms = await prisma.room.findMany({
            where,
            include: {
                bookings: {
                    where: {
                        status: { in: ['CHECKED_IN', 'RESERVED'] },
                        // If date range provided, filter bookings within that range too
                        ...(start && end ? {
                            OR: [
                                { checkIn: { lte: new Date(end) }, checkOut: { gte: new Date(start) } }
                            ]
                        } : {})
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

        // Filter out rooms that HAVE bookings if start/end is provided (real-time availability)
        let filteredRooms = rooms
        if (start && end && status === 'AVAILABLE') {
            filteredRooms = rooms.filter(room => room.bookings.length === 0)
        }

        // Auto-correct mis-synchronized statuses
        const now = new Date()
        const syncedRooms = await Promise.all(filteredRooms.map(async (room) => {
            // Room should be OCCUPIED if it has a CHECKED_IN or a RESERVED booking for "now"
            const hasBookingNow = room.bookings.some(b => {
                const ci = new Date(b.checkIn).getTime()
                const co = new Date(b.checkOut).getTime()
                return ci <= now.getTime() && co >= now.getTime()
            });

            // If room is marked OCCUPIED but has no active booking right now, set it back to AVAILABLE
            if (room.status === 'OCCUPIED' && !hasBookingNow) {
                await prisma.room.update({
                    where: { id: room.id },
                    data: { status: 'AVAILABLE' }
                });
                return { ...room, status: 'AVAILABLE' };
            }

            // If room is AVAILABLE but HAS an active booking, set it to OCCUPIED
            if (room.status === 'AVAILABLE' && hasBookingNow) {
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
