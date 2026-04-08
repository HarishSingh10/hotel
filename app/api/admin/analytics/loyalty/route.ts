import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'])
        if (authResult instanceof NextResponse) return authResult

        const propertyId = authResult.user.propertyId
        if (!propertyId && authResult.user.role !== 'SUPER_ADMIN') {
             return NextResponse.json({ error: 'Property context required' }, { status: 400 })
        }

        // 1. Fetch all bookings for the property to analyze guest loyalty
        const bookings = await prisma.booking.findMany({
            where: propertyId ? { propertyId } : {},
            include: {
                guest: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                }
            }
        })

        // 2. Group by Guest
        const guestStats: Record<string, { 
            name: string; 
            email: string; 
            stays: number; 
            spent: number; 
            lastVisit: Date;
            sources: Set<string>;
        }> = {}

        let totalRevenue = 0
        bookings.forEach(b => {
            if (!b.guest) return
            const gid = b.guestId
            if (!guestStats[gid]) {
                guestStats[gid] = { 
                    name: b.guest.name, 
                    email: b.guest.email || 'N/A', 
                    stays: 0, 
                    spent: 0, 
                    lastVisit: b.checkIn,
                    sources: new Set()
                }
            }
            guestStats[gid].stays += 1
            guestStats[gid].spent += b.totalAmount
            if (b.checkIn > guestStats[gid].lastVisit) {
                guestStats[gid].lastVisit = b.checkIn
            }
            guestStats[gid].sources.add(b.source)
            totalRevenue += b.totalAmount
        })

        const guests = Object.values(guestStats)
        const totalGuests = guests.length
        const repeatGuests = guests.filter(g => g.stays > 1)
        const repeatGuestCount = repeatGuests.length
        const repeatRate = totalGuests > 0 ? Math.round((repeatGuestCount / totalGuests) * 100) : 0
        
        const loyaltyRevenue = repeatGuests.reduce((sum, g) => sum + g.spent, 0)
        const loyaltyRevenuePercent = totalRevenue > 0 ? Math.round((loyaltyRevenue / totalRevenue) * 100) : 0
        const avgLTV = totalGuests > 0 ? totalRevenue / totalGuests : 0

        // 3. Top Guests Ranking
        const topGuests = guests
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 10)
            .map(g => {
                let tier = 'BRONZE'
                let color = 'text-orange-400'
                let bg = 'bg-orange-400/10'
                let border = 'border-orange-400/20'

                if (g.spent > 50000 || g.stays > 10) {
                    tier = 'PLATINUM'
                    color = 'text-cyan-400'
                    bg = 'bg-cyan-400/10'
                    border = 'border-cyan-400/20'
                } else if (g.spent > 20000 || g.stays > 5) {
                    tier = 'GOLD'
                    color = 'text-amber-400'
                    bg = 'bg-amber-400/10'
                    border = 'border-amber-400/20'
                } else if (g.spent > 10000 || g.stays > 2) {
                    tier = 'SILVER'
                    color = 'text-slate-400'
                    bg = 'bg-slate-400/10'
                    border = 'border-slate-400/20'
                }

                return {
                    ...g,
                    tier,
                    color,
                    bg,
                    border
                }
            })

        // 4. Chart Data (Last 6 Months)
        const chartData = []
        for (let i = 5; i >= 0; i--) {
            const mDate = subMonths(new Date(), i)
            const mStart = startOfMonth(mDate)
            const mEnd = endOfMonth(mDate)
            
            const monthBookings = bookings.filter(b => b.createdAt >= mStart && b.createdAt <= mEnd)
            const repeatOnes = monthBookings.filter(b => {
                // Was this person a repeat guest AT THE TIME of this booking?
                // Simple heuristic: check if they had any booking BEFORE this one's createdAt
                const priorBookings = bookings.filter(pb => pb.guestId === b.guestId && pb.createdAt < b.createdAt)
                return priorBookings.length > 0
            })

            chartData.push({
                month: format(mDate, 'MMM'),
                repeat: repeatOnes.length,
                firstTime: monthBookings.length - repeatOnes.length
            })
        }

        return NextResponse.json({
            stats: {
                repeatRate,
                repeatGuestCount,
                loyaltyRevenue,
                loyaltyRevenuePercent,
                avgLTV,
                totalGuests
            },
            topGuests,
            chartData
        })

    } catch (error: any) {
        console.error('[LOYALTY_ANALYTICS_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
