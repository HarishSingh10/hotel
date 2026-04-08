import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const category = searchParams.get('category')
        const query = searchParams.get('query')

        const where: any = {}
        if (status && status !== 'All') where.status = status
        if (category && category !== 'All') where.category = category
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
            ]
        }

        const prismaModel = (prisma as any).lostItem || (prisma as any).lostItem || (prisma as any).lost_item;
        if (!prismaModel) { 
            console.error('Available Models:', Object.keys(prisma))
            return NextResponse.json({ error: 'Database model sync error. Check server logs.' }, { status: 500 })
        }

        const items = await prismaModel.findMany({
            where,
            include: {
                room: true,
                reportedBy: {
                    include: { user: { select: { name: true } } }
                },
                guest: true,
                booking: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error('Error fetching lost items:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, category, location, description, roomId, image, propertyId } = body

        if (!name || !propertyId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        let guestId = null
        let bookingId = null

        // If roomId is provided, try to find the most recent/active booking to suggest a guest
        if (roomId) {
            const recentBooking = await prisma.booking.findFirst({
                where: {
                    roomId,
                    status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }
                },
                orderBy: { checkOut: 'desc' }
            })

            if (recentBooking) {
                guestId = recentBooking.guestId
                bookingId = recentBooking.id
            }
        }

        const staffProfile = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })

        if (!(prisma as any).lostItem) {
            console.error('Prisma Model "lostItem" is missing. Available models:', Object.keys(prisma))
            throw new Error('Database model synchronization error.')
        }

        const item = await (prisma as any).lostItem.create({
            data: {
                name,
                category,
                location,
                description,
                status: 'FOUND',
                roomId,
                propertyId,
                reportedById: staffProfile?.id,
                guestId,
                bookingId,
                image,
                caseNotes: [
                    {
                        content: `Asset discovery protocol initiated. Security hash generated. Item transitioned to vault storage at ${location || (roomId ? `Room ${roomId}` : 'undisclosed location')}.`,
                        author: session.user.name || 'System Auto',
                        createdAt: new Date()
                    }
                ]
            },
            include: {
                room: true,
                guest: true
            }
        })

        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('Error creating lost item:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
