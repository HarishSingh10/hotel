import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const queryPropertyId = searchParams.get('propertyId')

    const whereClause: any = {}

    // RBAC: Super Admin can see everything or filter by specific property
    if (session.user.role === 'SUPER_ADMIN') {
        if (queryPropertyId && queryPropertyId !== 'ALL') {
            whereClause.propertyId = queryPropertyId
        }
    } else {
        const propertyId = session.user.propertyId
        if (propertyId) {
            whereClause.propertyId = propertyId
        }
    }

    // If date range provided (for calendar)
    if (start && end) {
        whereClause.checkIn = {
            gte: new Date(start),
            lte: new Date(end)
        }
    }

    try {
        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: {
                guest: { select: { name: true, phone: true } },
                room: { select: { roomNumber: true } }
            },
            orderBy: { checkIn: 'asc' }
        })

        // Transform for UI if needed, but returning raw is fine for now
        return NextResponse.json(bookings)

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await request.json()

        // Create guest first or link existing? 
        // Simplified: Input includes guestId

        const propertyId = session.user.propertyId
        if (!propertyId) return new NextResponse('Missing property ID', { status: 400 })

        const booking = await prisma.booking.create({
            data: {
                propertyId: propertyId,
                guestId: body.guestId,
                roomId: body.roomId,
                checkIn: new Date(body.checkIn),
                checkOut: new Date(body.checkOut),
                numberOfGuests: body.numberOfGuests,
                totalAmount: body.totalAmount,
                status: 'RESERVED',
                source: body.source || 'DIRECT'
            },
            include: {
                guest: { select: { name: true, phone: true } },
                room: { select: { roomNumber: true } }
            }
        })

        // Update Room Status
        await prisma.room.update({
            where: { id: body.roomId },
            data: { status: 'OCCUPIED' }
        })

        // Mock Notification System
        // In a real app, you'd trigger an SMS/WhatsApp here via Twilio/etc.
        console.log(`[NOTIFICATION] New booking confirmed for ${booking.guest.name} in Room ${booking.room.roomNumber}`)

        return NextResponse.json({
            ...booking,
            notificationSent: true,
            message: `Booking confirmed for ${booking.guest.name}`
        })
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
