import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/bulk-import
 * Process bulk booking import
 */
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const session = await getServerSession(authOptions)
        const body = await req.json()
        const { propertyId, bookings } = body

        if (!propertyId && session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
        }

        const targetPropertyId = propertyId || session?.user?.propertyId

        if (!targetPropertyId) {
            return NextResponse.json({ error: 'Target property not identified' }, { status: 400 })
        }

        let successCount = 0
        let errorCount = 0

        // Process bookings sequentially to avoid overwhelming the DB
        // In a real scenario, this would be a background job with BullMQ or similar
        for (const bookingData of (bookings || [])) {
            try {
                // 1. Create or Find Guest
                const guest = await prisma.guest.upsert({
                    where: { email: bookingData.guestEmail },
                    update: {
                        name: bookingData.guestName,
                        phone: bookingData.guestPhone || '',
                    },
                    create: {
                        name: bookingData.guestName,
                        email: bookingData.guestEmail,
                        phone: bookingData.guestPhone || '',
                        checkInStatus: 'PENDING'
                    }
                })

                // 2. Find a suitable room (simplified: pick first available of category)
                const room = await prisma.room.findFirst({
                    where: {
                        propertyId: targetPropertyId,
                        category: bookingData.roomCategory || 'STANDARD',
                        status: 'AVAILABLE'
                    }
                })

                if (!room) {
                    throw new Error('No available room for category: ' + bookingData.roomCategory)
                }

                // 3. Create Booking
                await prisma.booking.create({
                    data: {
                        guestId: guest.id,
                        propertyId: targetPropertyId,
                        roomId: room.id,
                        checkIn: new Date(bookingData.checkIn),
                        checkOut: new Date(bookingData.checkOut),
                        numberOfGuests: bookingData.guests || 2,
                        totalAmount: bookingData.totalAmount || 0,
                        paidAmount: 0,
                        status: 'RESERVED',
                        source: bookingData.source || 'DIRECT',
                        paymentStatus: 'PENDING'
                    }
                })

                successCount++
            } catch (err) {
                console.error('[IMPORT_ROW_ERROR]', err)
                errorCount++
            }
        }

        return NextResponse.json({
            message: 'Import completed',
            summary: {
                total: (bookings || []).length,
                success: successCount,
                errors: errorCount
            }
        })

    } catch (error: any) {
        console.error('[BULK_IMPORT_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error during bulk import' }, { status: 500 })
    }
}
