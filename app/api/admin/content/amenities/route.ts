import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const propertyId = searchParams.get('propertyId')

        if (!propertyId || propertyId === 'ALL') {
            return NextResponse.json([])
        }

        const amenities = await prisma.amenity.findMany({
            where: { propertyId }
        })
        return NextResponse.json(amenities)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role === 'GUEST') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { id, propertyId, name, icon, description, category, isActive } = body

        if (!propertyId) return new NextResponse('Missing propertyId', { status: 400 })

        if (id) {
            const updated = await prisma.amenity.update({
                where: { id },
                data: { name, icon, description, category, isActive }
            })
            return NextResponse.json(updated)
        } else {
            const amenity = await prisma.amenity.create({
                data: { name, icon, description, category, propertyId, isActive: isActive ?? true }
            })
            return NextResponse.json(amenity)
        }
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role === 'GUEST') return new NextResponse('Unauthorized', { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return new NextResponse('Missing id', { status: 400 })

        await prisma.amenity.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return new NextResponse('Error', { status: 500 })
    }
}
