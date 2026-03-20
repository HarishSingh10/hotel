import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'])
        if (authResult instanceof NextResponse) return authResult

        const now = new Date()
        const start = startOfMonth(now)
        const end = endOfMonth(now)

        // Fetch food orders
        const orders = await prisma.serviceRequest.findMany({
            where: {
                type: 'FOOD_ORDER',
                createdAt: { gte: start, lte: end }
            },
            select: {
                title: true,
                amount: true,
                status: true,
                createdAt: true,
                ratings: {
                    select: { rating: true }
                }
            }
        })

        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
        const totalCovers = orders.length
        const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0

        // Group by item title to find popular items
        const itemStats: Record<string, { units: number; revenue: number; ratings: number[]; totalRating: number }> = {}
        
        orders.forEach(o => {
            const title = o.title || 'Unknown Item'
            if (!itemStats[title]) {
                itemStats[title] = { units: 0, revenue: 0, ratings: [], totalRating: 0 }
            }
            itemStats[title].units += 1
            itemStats[title].revenue += o.amount || 0
            if (o.ratings && o.ratings.length > 0) {
                const r = o.ratings[0].rating
                itemStats[title].ratings.push(r)
                itemStats[title].totalRating += r
            }
        })

        const topSelling = Object.entries(itemStats)
            .map(([name, stats]) => ({
                name,
                units: stats.units,
                revenue: stats.revenue,
                avgRating: stats.ratings.length > 0 ? stats.totalRating / stats.ratings.length : 0,
                progress: 0 // Will calculate based on max units below
            }))
            .sort((a, b) => b.units - a.units)

        const maxUnits = topSelling.length > 0 ? topSelling[0].units : 1
        topSelling.forEach(item => {
            item.progress = Math.round((item.units / maxUnits) * 100)
        })

        const poorPerforming = topSelling
            .filter(item => item.units < 5 || item.avgRating < 3)
            .slice(0, 5)
            .map(item => ({
                id: `M-${item.name.substring(0, 3).toUpperCase()}`,
                name: item.name,
                category: 'Main Course', // Placeholder
                sales: item.units,
                trend: 'down',
                sentiment: item.avgRating,
                status: item.avgRating < 2.5 ? 'REVIEW REQ.' : 'PROMOTION NEEDED'
            }))

        return NextResponse.json({
            stats: {
                totalRevenue,
                avgCheck,
                totalCovers,
                peakHours: '19:30 - 21:00' // Placeholder
            },
            topSelling: topSelling.slice(0, 10),
            poorPerforming
        })

    } catch (error: any) {
        console.error('[RESTAURANT_ANALYTICS_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
