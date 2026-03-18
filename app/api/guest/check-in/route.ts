import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, phone, idProof } = body

        if (!name || !phone) {
            return new NextResponse('Name and Phone are required', { status: 400 })
        }

        // Upsert Guest
        // We use phone as the unique identifier for guests
        const guest = await prisma.guest.upsert({
            where: { phone },
            update: {
                name,
                idDocumentFront: idProof, // Base64 string
                checkInStatus: 'COMPLETED',
                checkInCompletedAt: new Date(),
                updatedAt: new Date()
            },
            create: {
                name,
                phone,
                idDocumentFront: idProof,
                checkInStatus: 'COMPLETED',
                checkInCompletedAt: new Date()
            }
        })

        // In a real scenario, we would link this to an existing booking
        // For now, we'll return a success response with a generated ref

        return NextResponse.json({
            success: true,
            guestId: guest.id,
            bookingRef: 'ZB-' + Math.floor(1000 + Math.random() * 9000)
        })

    } catch (error) {
        console.error('Check-in error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
