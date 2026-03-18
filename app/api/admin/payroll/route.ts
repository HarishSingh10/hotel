import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Fetch all staff with their payrolls
        // In a real app we would filter by month/year
        const payrolls = await prisma.payroll.findMany({
            include: {
                staff: {
                    include: {
                        user: true
                    }
                }
            },
            take: 100
        })

        // Calculate totals
        const totalPayout = payrolls.reduce((acc, p) => acc + p.netSalary, 0)
        const totalIncentives = payrolls.reduce((acc, p) => acc + p.incentives, 0)
        const pendingCount = payrolls.filter(p => p.status === 'PENDING').length

        return NextResponse.json({
            payrolls,
            summary: {
                totalPayout,
                totalIncentives,
                pendingCount
            }
        })
    } catch (error) {
        console.error('[PAYROLL_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
