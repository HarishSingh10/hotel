import { NextResponse } from 'next/server'
import { PrismaClient } from '@/prisma/generated/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, address, phone, email, description, latitude, longitude } = body

        if (!name || !address || !phone || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const property = await prisma.property.create({
            data: {
                name,
                address,
                phone,
                email,
                description,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                checkInTime: '14:00',
                checkOutTime: '11:00',
            }
        })

        return NextResponse.json(property, { status: 201 })
    } catch (error) {
        console.error('Error creating property:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const properties = await prisma.property.findMany()
        return NextResponse.json(properties)
    } catch (error) {
        console.error('Error fetching properties:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
