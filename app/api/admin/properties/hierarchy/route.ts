import { NextResponse } from 'next/server'
import { PrismaClient } from '@/prisma/generated/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all properties with their owners and staff
        const properties = await prisma.property.findMany({
            include: {
                owners: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true
                    }
                },
                staff: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                status: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json(properties)
    } catch (error) {
        console.error('Error fetching property hierarchy:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
