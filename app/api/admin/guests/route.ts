import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        const propertyId = session.user.propertyId
        const whereClause: any = {}
        if (status && status !== 'ALL') whereClause.checkInStatus = status as any
        if (propertyId) {
            whereClause.bookings = {
                some: {
                    propertyId: propertyId
                }
            }
        }

        const guests = await prisma.guest.findMany({
            where: whereClause,
            include: {
                bookings: {
                    select: {
                        room: { select: { roomNumber: true } },
                        status: true,
                        source: true,
                        numberOfGuests: true,
                        checkIn: true,
                        checkOut: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Transform for frontend
        const formatted = guests.map(g => {
            const activeBooking = g.bookings[0] || {}
            return {
                id: g.id,
                name: g.name,
                email: g.email,
                phone: g.phone,
                roomNumber: activeBooking.room?.roomNumber || 'N/A',
                checkIn: activeBooking.checkIn,
                checkOut: activeBooking.checkOut,
                guestCount: activeBooking.numberOfGuests || 1,
                idVerified: g.checkInStatus === 'VERIFIED',
                source: activeBooking.source || 'DIRECT',
                status: activeBooking.status || 'RESERVED'
            }
        })

        return NextResponse.json(formatted)
    } catch (error) {
        console.error('[GUESTS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { name, email, phone, idType, idNumber, guestCount = 1 } = body

        if (!name || !phone) {
            return new NextResponse('Name and Phone are required', { status: 400 })
        }

        // Create or Update Guest
        const guest = await prisma.guest.upsert({
            where: { phone },
            update: {
                name,
                email,
                idType,
                idNumber
            },
            create: {
                name,
                email,
                phone,
                idType,
                idNumber,
                checkInStatus: 'PENDING'
            }
        })

        return NextResponse.json({
            success: true,
            guest,
            message: 'Guest profile created/updated'
        })
    } catch (error) {
        console.error('[GUESTS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
