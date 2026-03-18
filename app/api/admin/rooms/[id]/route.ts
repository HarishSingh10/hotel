import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HOTEL_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        // Check if room has active bookings
        const activeBookings = await prisma.booking.count({
            where: {
                roomId: params.id,
                status: { in: ['RESERVED', 'CHECKED_IN'] }
            }
        })

        if (activeBookings > 0) {
            return new NextResponse('Cannot delete room with active bookings', { status: 400 })
        }

        await prisma.room.delete({
            where: { id: params.id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[ROOM_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HOTEL_ADMIN' && session.user.role !== 'STAFF')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { status, basePrice, type, category } = body

        const room = await prisma.room.update({
            where: { id: params.id },
            data: {
                status: status || undefined,
                basePrice: basePrice ? parseFloat(basePrice.toString()) : undefined,
                type: type || undefined,
                category: category || undefined,
                images: body.images || undefined,
                maxOccupancy: body.maxOccupancy ? parseInt(body.maxOccupancy.toString()) : undefined,
                floor: body.floor ? parseInt(body.floor.toString()) : undefined,
                roomNumber: body.roomNumber || undefined,
                description: body.description !== undefined ? body.description : undefined,
                amenities: body.amenities !== undefined ? body.amenities : undefined,
            }
        })

        return NextResponse.json(room)
    } catch (error) {
        console.error('[ROOM_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
