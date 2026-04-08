import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { guests } = body

        if (!Array.isArray(guests)) {
            return new NextResponse('Invalid data format', { status: 400 })
        }

        const results = await prisma.$transaction(
            guests.map(g => 
                prisma.guest.upsert({
                    where: { phone: g.phone },
                    update: {
                        name: g.name,
                        email: g.email || undefined,
                        checkInStatus: 'PENDING'
                    },
                    create: {
                        name: g.name,
                        phone: g.phone,
                        email: g.email || undefined,
                        checkInStatus: 'PENDING'
                    }
                })
            )
        )

        return NextResponse.json({
            success: true,
            count: results.length
        })
    } catch (error) {
        console.error('[GUESTS_BULK_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
