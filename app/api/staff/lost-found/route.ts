import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const staff = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })
        if (!staff) return new NextResponse('Staff Profile Not Found', { status: 404 })

        const items = await prisma.lostItem.findMany({
            where: { reportedById: staff.id },
            include: { room: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error("Staff Lost-Found GET Error:", error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const staff = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })
        if (!staff) return new NextResponse('Staff Profile Not Found', { status: 404 })

        const body = await req.json()
        const { name, category, location, roomId, description, image } = body

        const item = await prisma.lostItem.create({
            data: {
                name,
                category: category || 'PERSONAL',
                location: location || '',
                description: description || '',
                image: image || null,
                status: 'FOUND',
                reportedById: staff.id,
                propertyId: staff.propertyId,
                roomId: roomId || null
            }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error("Staff Lost-Found POST Error:", error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
