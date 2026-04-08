import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET: Today's arrivals with guest verification details
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'  // all | pending | completed
    const queryPropertyId = searchParams.get('propertyId')

    // Build property filter
    const whereClause: any = {}
    if (session.user.role === 'SUPER_ADMIN') {
        if (queryPropertyId && queryPropertyId !== 'ALL') {
            whereClause.propertyId = queryPropertyId
        }
    } else {
        const propertyId = session.user.propertyId
        if (propertyId) whereClause.propertyId = propertyId
    }

    // Today's date range
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    // Filter: today + tomorrow arrivals for check-in manager
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const endOfTomorrow = new Date(tomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999)

    whereClause.checkIn = { gte: startOfDay, lte: endOfTomorrow }
    whereClause.status = { in: ['RESERVED', 'CHECKED_IN'] }

    // Status filter
    if (filter === 'pending') {
        whereClause.status = 'RESERVED'
    } else if (filter === 'completed') {
        whereClause.status = 'CHECKED_IN'
    }

    try {
        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: {
                guest: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        idType: true,
                        idNumber: true,
                        idDocumentFront: true,
                        idDocumentBack: true,
                        checkInStatus: true,
                        checkInCompletedAt: true,
                    }
                },
                room: {
                    select: {
                        roomNumber: true,
                        type: true,
                        category: true,
                    }
                }
            },
            orderBy: { checkIn: 'asc' }
        })

        // Get summary stats
        const allTodayBookings = await prisma.booking.findMany({
            where: {
                ...whereClause,
                checkIn: { gte: startOfDay, lte: endOfDay },
                status: { in: ['RESERVED', 'CHECKED_IN'] },
            },
        })

        const expected = allTodayBookings.length
        const completed = allTodayBookings.filter(b => b.status === 'CHECKED_IN').length
        const pending = allTodayBookings.filter(b => b.status === 'RESERVED').length

        // Monthly comparison logic
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const lastMonthBookingsCount = await prisma.booking.count({
            where: {
                ...whereClause,
                checkIn: { gte: thirtyDaysAgo, lte: endOfDay },
                status: { in: ['RESERVED', 'CHECKED_IN'] },
            }
        })
        
        const monthlyAverage = lastMonthBookingsCount / 30
        const monthlyChange = monthlyAverage > 0 ? ((completed / monthlyAverage) - 1) * 100 : 0

        // Count guests with pending ID verification
        const verificationPending = bookings.filter(b =>
            b.guest.checkInStatus !== 'VERIFIED' && b.guest.checkInStatus !== 'COMPLETED'
        ).length

        return NextResponse.json({
            stats: { expected, completed, pending, verificationPending },
            monthlyAverage,
            monthlyChange,
            bookings: bookings.map(b => ({
                id: b.id,
                guestId: b.guest.id,
                guestName: b.guest.name,
                guestPhone: b.guest.phone,
                guestEmail: b.guest.email,
                resId: `#RES-${b.id.slice(-4).toUpperCase()}`,
                roomNumber: b.room.roomNumber,
                roomType: b.room.type,
                checkIn: b.checkIn,
                checkOut: b.checkOut,
                status: b.status,
                source: b.source,
                idType: b.guest.idType,
                idNumber: b.guest.idNumber,
                idDocumentFront: b.guest.idDocumentFront,
                idDocumentBack: b.guest.idDocumentBack,
                checkInStatus: b.guest.checkInStatus,
                checkInCompletedAt: b.guest.checkInCompletedAt,
            }))
        })
    } catch (error) {
        console.error('[CHECKIN_GET]', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
