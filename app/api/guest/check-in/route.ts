import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        let { name, phone, idProof, bookingId } = body

        if (!name || !phone) {
            return new NextResponse('Name and Phone are required', { status: 400 })
        }

        // Standardize phone (take last 10 digits to match)
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)

        let guestId = null

        // If we have a bookingId, we update THAT specific guest linked to the booking
        if (bookingId) {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { guest: true }
            })

            if (booking) {
                guestId = booking.guestId
            }
        }

        // Robust resolution strategy:
        // 1. Try to find a guest by phone first (to avoid P2002 unique constraint conflicts)
        let resolvedGuest = await prisma.guest.findUnique({ where: { phone: cleanPhone } })

        // 2. If not found by phone, but we have a guestId from the booking, try to find them by ID
        if (!resolvedGuest && guestId) {
            resolvedGuest = await prisma.guest.findUnique({ where: { id: guestId } })
        }

        let guest
        if (resolvedGuest) {
            // Update the record we found
            guest = await prisma.guest.update({
                where: { id: resolvedGuest.id },
                data: {
                    name,
                    phone: cleanPhone,
                    idDocumentFront: idProof,
                    checkInStatus: 'COMPLETED',
                    checkInCompletedAt: new Date(),
                    updatedAt: new Date()
                }
            })
        } else {
            // Create a brand new record
            guest = await prisma.guest.create({
                data: {
                    name,
                    phone: cleanPhone,
                    idDocumentFront: idProof,
                    checkInStatus: 'COMPLETED',
                    checkInCompletedAt: new Date()
                }
            })
        }

        // 3. Critically: Ensure the booking points to this resolved guest
        // This handles cases where the booking was originally linked to a guest with a different phone
        if (bookingId) {
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    guestId: guest.id,
                    updatedAt: new Date()
                }
            })
        }

        return NextResponse.json({
            success: true,
            guestId: guest.id,
            bookingRef: 'ZB-' + guest.id.slice(-4).toUpperCase()
        })

    } catch (error) {
        console.error('Check-in error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
