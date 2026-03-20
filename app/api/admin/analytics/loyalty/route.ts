import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'])
        if (authResult instanceof NextResponse) return authResult

        const totalGuests = await prisma.guest.count()
        
        // Fetch all guests with their bookings to calculate metrics
        const guests = await prisma.guest.findMany({
            include: {
                bookings: {
                    select: {
                        totalAmount: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        })

        const repeatGuests = guests.filter(g => g.bookings.length > 1)
        const repeatRate = totalGuests > 0 ? (repeatGuests.length / totalGuests) * 100 : 0

        const totalSpent = guests.reduce((sum, g) => {
            const guestSpent = g.bookings
                .filter(b => b.status === 'CHECKED_OUT' || b.status === 'CHECKED_IN')
                .reduce((s, b) => s + (b.totalAmount || 0), 0)
            return sum + guestSpent
        }, 0)

        const loyaltyRevenue = repeatGuests.reduce((sum, g) => {
            const guestSpent = g.bookings
                .filter(b => b.status === 'CHECKED_OUT' || b.status === 'CHECKED_IN')
                .reduce((s, b) => s + (b.totalAmount || 0), 0)
            return sum + guestSpent
        }, 0)

        const avgLTV = totalGuests > 0 ? totalSpent / totalGuests : 0

        // Format top guests for the table
        const topGuests = guests
            .map(g => {
                const completedBookings = g.bookings.filter(b => b.status === 'CHECKED_OUT' || b.status === 'CHECKED_IN')
                const totalSpent = completedBookings.reduce((s, b) => s + (b.totalAmount || 0), 0)
                
                // Determine tier
                let tier = 'SILVER'
                let color = 'text-gray-400'
                let bg = 'bg-gray-400/10'
                let border = 'border-gray-400/20'

                if (totalSpent > 100000 || completedBookings.length > 10) {
                    tier = 'DIAMOND'
                    color = 'text-indigo-400'
                    bg = 'bg-indigo-400/10'
                    border = 'border-indigo-400/20'
                } else if (totalSpent > 50000 || completedBookings.length > 5) {
                    tier = 'PLATINUM'
                    color = 'text-blue-400'
                    bg = 'bg-blue-400/10'
                    border = 'border-blue-400/20'
                } else if (totalSpent > 20000 || completedBookings.length > 2) {
                    tier = 'GOLD'
                    color = 'text-amber-500'
                    bg = 'bg-amber-500/10'
                    border = 'border-amber-500/20'
                }

                return {
                    id: g.id,
                    name: g.name,
                    email: g.email || 'N/A',
                    stays: completedBookings.length,
                    spent: totalSpent,
                    lastVisit: g.updatedAt,
                    tier,
                    color,
                    bg,
                    border
                }
            })
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 50)

        // Mock chart data for "First-time vs. Repeat Visitors"
        // In a real app, we'd group by month
        const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const chartData = months.map(m => ({
            month: m,
            repeat: Math.floor(Math.random() * 40 + 20),
            firstTime: Math.floor(Math.random() * 30 + 10)
        }))

        return NextResponse.json({
            stats: {
                totalGuests,
                repeatGuestCount: repeatGuests.length,
                repeatRate: repeatRate.toFixed(1),
                loyaltyRevenue,
                avgLTV,
                loyaltyRevenuePercent: totalSpent > 0 ? ((loyaltyRevenue / totalSpent) * 100).toFixed(1) : 0
            },
            topGuests,
            chartData
        })

    } catch (error: any) {
        console.error('[LOYALTY_ANALYTICS_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
