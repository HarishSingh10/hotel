import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/marketing
 * Get marketing stats and list of campaigns
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'])
        if (authResult instanceof NextResponse) return authResult

        const { searchParams } = new URL(req.url)
        const queryPropertyId = searchParams.get('propertyId')
        const session = await getServerSession(authOptions)

        let whereProperty: any = {}
        if (session?.user?.role === 'SUPER_ADMIN') {
            if (queryPropertyId && queryPropertyId !== 'ALL') {
                whereProperty = { propertyId: queryPropertyId }
            }
        } else {
            const propertyId = session?.user?.propertyId
            if (propertyId) whereProperty = { propertyId }
        }

        // 1. Fetch Campaigns
        const campaigns = await (prisma as any).campaign.findMany({
            where: whereProperty,
            orderBy: { startedAt: 'desc' }
        })

        // 2. Fetch Stats
        // Active Campaigns
        const activeCampaignsCount = await (prisma as any).campaign.count({
            where: { ...whereProperty, status: 'ACTIVE' }
        })

        // VIP Segment Size (Simulation: Guests with 3+ bookings or spent > 5000)
        // Note: propertyId is in Booking, not in Guest directly.
        // To get guests for a property, we look at bookings in that property.
        const guestStats = await prisma.booking.groupBy({
            by: ['guestId'],
            where: whereProperty,
            _count: { id: true },
            _sum: { totalAmount: true }
        })

        const vipGuests = guestStats.filter(g => (g._count.id >= 3) || (g._sum.totalAmount || 0) >= 5000)
        const vipSegmentSize = vipGuests.length

        // VIP Performance by Tier (Calculation)
        const diamondCount = guestStats.filter(g => (g._count.id >= 10 || (g._sum.totalAmount || 0) >= 15000)).length
        const platinumCount = guestStats.filter(g => (g._count.id >= 5 || (g._sum.totalAmount || 0) >= 8000)).length
        const goldCount = guestStats.filter(g => (g._count.id >= 2 || (g._sum.totalAmount || 0) >= 3000)).length

        const totalVips = diamondCount + platinumCount + goldCount || 1 // Avoid division by zero
        const tierPerformance = [
            { label: 'Diamond', height: `${Math.round((diamondCount / totalVips) * 100)}%`, color: 'bg-blue-600' },
            { label: 'Platinum', height: `${Math.round((platinumCount / totalVips) * 100)}%`, color: 'bg-blue-600/80' },
            { label: 'Gold', height: `${Math.round((goldCount / totalVips) * 100)}%`, color: 'bg-blue-600/60' },
        ]

        // Total Marketing Revenue (Simulation: 15% of total revenue is attributed to marketing for now)
        const totalRevenue = await prisma.booking.aggregate({
            where: { ...whereProperty, status: 'CHECKED_OUT' },
            _sum: { totalAmount: true }
        })
        const marketingRevenue = (totalRevenue._sum.totalAmount || 0) * 0.15 // 15% attribution

        // Average Conversion Rate (Simulation)
        const conversionRate = 18.5

        return NextResponse.json({
            campaigns: campaigns.map((c: any) => ({
                id: c.id,
                name: c.name,
                started: new Date(c.startedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                segment: c.segment,
                performance: c.performance,
                status: c.status,
                channel: c.channel,
                promoCode: c.promoCode
            })),
            stats: {
                activeCampaigns: activeCampaignsCount,
                vipSegmentSize,
                conversionRate: `${conversionRate}%`,
                marketingRevenue: `₹${marketingRevenue.toLocaleString()}`
            },
            tierPerformance
        })

    } catch (error: any) {
        console.error('[MARKETING_GET_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

/**
 * POST /api/admin/marketing
 * Create a new campaign or send a quick promotion
 */
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { name, segment, channel, promoCode, propertyId: bodyPropertyId } = body

        const session = await getServerSession(authOptions)
        let propertyId = session?.user?.propertyId

        if (session?.user?.role === 'SUPER_ADMIN') {
            propertyId = bodyPropertyId || 'GLOBAL' // Should ideally have a default or picked property
        }

        if (!propertyId || propertyId === 'GLOBAL') {
            // If SUPER_ADMIN didn't provide a propertyId, we might need to handle it.
            // For this app, most actions require a property context.
            // Let's assume they provide one or we pick the first one they own if missing.
            const ownedProperties = session?.user?.ownedPropertyIds || []
            if (ownedProperties.length > 0) propertyId = ownedProperties[0]
        }

        if (!propertyId) {
            return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
        }

        const campaign = await (prisma as any).campaign.create({
            data: {
                name: name || 'Quick Promotion',
                segment: segment || 'All VIPs',
                channel: channel || 'EMAIL',
                promoCode: promoCode || '',
                status: 'ACTIVE',
                performance: Math.floor(Math.random() * 20) + 10, // Initial mock performance
                propertyId
            }
        })

        return NextResponse.json(campaign)

    } catch (error: any) {
        console.error('[MARKETING_POST_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
