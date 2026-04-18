import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'])
        if (authResult instanceof NextResponse) return authResult

        const { searchParams } = new URL(req.url)
        const tab = searchParams.get('tab') || 'All Day'
        const range = searchParams.get('range') || 'month'

        const now = new Date()
        let start = startOfMonth(now)
        let end = endOfMonth(now)

        if (range === 'lastMonth') {
            const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            start = startOfMonth(last)
            end = endOfMonth(last)
        } else if (range === 'quarter') {
            start = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
        } else if (range === 'year') {
            start = new Date(now.getFullYear(), 0, 1)
        }

        const propertyId = authResult.user.propertyId
        if (!propertyId && authResult.user.role !== 'SUPER_ADMIN') {
             return NextResponse.json({ error: 'Property context required' }, { status: 400 })
        }

        // 1. Fetch Menu Items — deduplicate by name at DB level
        const allMenuItems = await prisma.menuItem.findMany({
            where: {
                ...(propertyId ? { propertyId } : {}),
                ...(tab !== 'All Day' ? { category: tab } : {})
            },
            orderBy: { updatedAt: 'desc' } // most recently updated first
        })

        // Deduplicate: keep only the first (most recent) occurrence of each name
        const seenNames = new Set<string>()
        const menuItems = allMenuItems.filter(mi => {
            const key = mi.name.toLowerCase().trim()
            if (seenNames.has(key)) return false
            seenNames.add(key)
            return true
        })

        const validItemNames = new Set(menuItems.map(m => m.name))

        // 2. Fetch food orders for the period
        const allOrders = await prisma.serviceRequest.findMany({
            where: {
                type: 'FOOD_ORDER',
                createdAt: { gte: start, lte: end },
                ...(propertyId ? { propertyId } : {})
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

        // Filter orders based on the filtered menu items if a tab is selected
        const orders = tab === 'All Day' 
            ? allOrders 
            : allOrders.filter(o => validItemNames.has(o.title || ''))

        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
        const totalCovers = orders.length
        const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0

        // 3. Aggregate item performance
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

        // 4. Map menu items to performance data (already deduplicated above)
        const itemPerformance = menuItems.map(mi => {
            const stats = itemStats[mi.name] || { units: 0, revenue: 0, totalRating: 0, ratings: [] }
            return {
                id: mi.id,
                name: mi.name,
                category: mi.category,
                price: mi.price,
                margin: mi.margin || 0,
                units: stats.units,
                revenue: stats.revenue,
                avgRating: stats.ratings.length > 0 ? stats.totalRating / stats.ratings.length : 0,
            }
        })

        // 5. Classification Logic (Stars, Puzzles, etc)
        const totalUnits = itemPerformance.reduce((sum, i) => sum + i.units, 0)
        const avgUnits = itemPerformance.length > 0 ? totalUnits / itemPerformance.length : 0
        const totalMargin = itemPerformance.reduce((sum, i) => sum + i.margin, 0)
        const avgMargin = itemPerformance.length > 0 ? totalMargin / itemPerformance.length : 0

        const stars = itemPerformance.filter(i => i.units >= avgUnits && i.margin >= avgMargin).sort((a, b) => b.units - a.units).slice(0, 5)
        const plowhorses = itemPerformance.filter(i => i.units >= avgUnits && i.margin < avgMargin).sort((a, b) => b.units - a.units).slice(0, 5)
        const puzzles = itemPerformance.filter(i => i.units < avgUnits && i.margin >= avgMargin).sort((a, b) => b.margin - a.margin).slice(0, 5)
        const dogs = itemPerformance.filter(i => i.units < avgUnits && i.margin < avgMargin).sort((a, b) => a.units - b.units).slice(0, 5)

        // 6. Category Analysis
        const catStats: Record<string, number> = {}
        itemPerformance.forEach(i => {
            catStats[i.category] = (catStats[i.category] || 0) + i.revenue
        })
        const categories = Object.entries(catStats)
            .map(([label, revenue]) => ({
                label,
                revenue,
                value: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
            }))
            .sort((a, b) => b.revenue - a.revenue)

        const topSellingItems = [...itemPerformance]
            .sort((a, b) => b.units - a.units)
            .slice(0, 10)
        
        const topSelling = topSellingItems.map(i => ({
            name: i.name,
            units: i.units,
            progress: topSellingItems[0].units > 0 ? Math.round((i.units / topSellingItems[0].units) * 100) : 0
        }))

        const poorPerforming = itemPerformance
            .filter(item => item.units < avgUnits || item.avgRating < 3)
            .sort((a, b) => a.avgRating - b.avgRating)
            .slice(0, 5)
            .map(item => ({
                id: item.id.substring(0, 8).toUpperCase(),
                name: item.name,
                category: item.category,
                sales: item.units,
                trend: item.units < avgUnits / 2 ? 'down' : 'stable',
                sentiment: item.avgRating,
                status: item.avgRating < 2.5 ? 'REVIEW REQ.' : 'PROMOTION NEEDED'
            }))

        return NextResponse.json({
            stats: {
                totalRevenue,
                avgCheck,
                totalCovers,
                peakHours: 'Typically 19:30 - 21:00'
            },
            categories,
            matrix: {
                stars,
                plowhorses,
                puzzles,
                dogs
            },
            topSelling: topSelling,
            poorPerforming
        })

    } catch (error: any) {
        console.error('[RESTAURANT_ANALYTICS_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
