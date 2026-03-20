import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/dashboard
 * Get high-level stats for the dashboard
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'])
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

        const today = new Date()

        // Parallelize ALL queries for maximum performance
        const [
            totalRooms,
            occupiedRooms,
            todayArrivals,
            todayDepartures,
            pendingServices,
            activeServices,
            monthlyRevenue,
            todayRevenue,
            recentArrivals,
            recentDepartures,
            dirtyRooms,
            maintenanceRooms,
            cleanRooms,
            priorityCleaning,
            onDutyStaffFull,
            recentActivity,
            recentBookingActivity,
            availableRoomsByCategory
        ] = await Promise.all([
            // 1. Occupancy Stats
            prisma.room.count({ where: whereProperty }),
            prisma.room.count({ where: { ...whereProperty, status: 'OCCUPIED' } }),

            // 2. Today's Arrivals & Departures
            prisma.booking.count({
                where: {
                    ...whereProperty,
                    checkIn: { gte: startOfDay(today), lte: endOfDay(today) },
                    status: 'RESERVED'
                }
            }),
            prisma.booking.count({
                where: {
                    ...whereProperty,
                    checkOut: { gte: startOfDay(today), lte: endOfDay(today) },
                    status: 'CHECKED_IN'
                }
            }),

            // 3. Service Request Status
            prisma.serviceRequest.count({
                where: { ...whereProperty, status: 'PENDING' }
            }),
            prisma.serviceRequest.count({
                where: { ...whereProperty, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } }
            }),

            // 4. Revenue (Monthly & Today)
            prisma.booking.aggregate({
                where: {
                    ...whereProperty,
                    status: 'CHECKED_OUT',
                    updatedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
                },
                _sum: { totalAmount: true }
            }),
            prisma.booking.aggregate({
                where: {
                    ...whereProperty,
                    status: 'CHECKED_OUT',
                    updatedAt: { gte: startOfDay(today), lte: endOfDay(today) }
                },
                _sum: { totalAmount: true }
            }),

            // 6. Recent Arrivals
            prisma.booking.findMany({
                where: {
                    ...whereProperty,
                    checkIn: { gte: startOfDay(today), lte: endOfDay(today) }
                },
                include: {
                    guest: { select: { name: true } },
                    room: { select: { roomNumber: true, type: true } }
                },
                take: 10,
                orderBy: { checkIn: 'asc' }
            }),

            // 7. Recent Departures
            prisma.booking.findMany({
                where: {
                    ...whereProperty,
                    checkOut: { gte: startOfDay(today), lte: endOfDay(today) },
                    status: 'CHECKED_IN'
                },
                include: {
                    guest: { select: { name: true } },
                    room: { select: { roomNumber: true, type: true } }
                },
                take: 5,
                orderBy: { checkOut: 'asc' }
            }),

            // 8. Housekeeping Status Counts
            prisma.room.count({ where: { ...whereProperty, status: 'CLEANING' } }),
            prisma.room.count({ where: { ...whereProperty, status: 'MAINTENANCE' } }),
            prisma.room.count({ where: { ...whereProperty, status: 'AVAILABLE' } }),

            // Priority cleaning
            prisma.serviceRequest.findMany({
                where: { ...whereProperty, type: 'HOUSEKEEPING', status: { in: ['PENDING', 'IN_PROGRESS'] } },
                include: {
                    room: { select: { roomNumber: true } },
                    assignedTo: { include: { user: { select: { name: true } } } }
                },
                take: 3,
                orderBy: { createdAt: 'desc' }
            }),

            // 9. On-duty staff
            prisma.attendance.findMany({
                where: {
                    date: { gte: startOfDay(today), lte: endOfDay(today) },
                    punchOut: null,
                    staff: whereProperty
                },
                include: {
                    staff: { include: { user: { select: { name: true } } } }
                }
            }),

            // 10. Activity logs
            prisma.serviceRequest.findMany({
                where: { ...whereProperty, updatedAt: { gte: startOfDay(today) }, status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
                include: { room: { select: { roomNumber: true } }, guest: { select: { name: true } } },
                take: 5, orderBy: { updatedAt: 'desc' }
            }),
            prisma.booking.findMany({
                where: { ...whereProperty, updatedAt: { gte: startOfDay(today) } },
                include: { guest: { select: { name: true } }, room: { select: { roomNumber: true } } },
                take: 5, orderBy: { updatedAt: 'desc' }
            }),

            // Available room categories
            prisma.room.groupBy({
                by: ['category'],
                where: { ...whereProperty, status: 'AVAILABLE' },
                _count: true
            }),

            // SLA Breaches (requests that exceeded 30 mins)
            prisma.serviceRequest.count({
                where: {
                    ...whereProperty,
                    status: 'COMPLETED',
                    updatedAt: { gte: startOfDay(today) },
                }
            })
        ])

        // Calculate occupancy trend (very simplified: compare with yesterday)
        const yesterday = subDays(today, 1)
        const yesterdayOccupancyCount = await prisma.booking.count({
            where: {
                ...whereProperty,
                checkIn: { lte: endOfDay(yesterday) },
                checkOut: { gte: startOfDay(yesterday) },
                status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }
            }
        })
        const yesterdayOccupancyRate = totalRooms > 0 ? Math.round((yesterdayOccupancyCount / totalRooms) * 100) : 0
        const currentOccupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
        const occupancyTrend = currentOccupancyRate - yesterdayOccupancyRate
        // Process and sort activity logs
        const allActivity = [
            ...recentActivity.map((a: any) => ({
                time: new Date(a.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                action: a.status === 'COMPLETED'
                    ? `Room ${a.room?.roomNumber || '?'} marked as Clean.`
                    : `${a.type.replace('_', ' ')} in progress for Room ${a.room?.roomNumber || '?'}.`,
                timestamp: a.updatedAt
            })),
            ...recentBookingActivity.map((b: any) => ({
                time: new Date(b.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                action: b.status === 'CHECKED_IN'
                    ? `${b.guest.name} checked in to Room ${b.room?.roomNumber || '?'}.`
                    : b.status === 'RESERVED'
                        ? `Booking confirmed for ${b.guest.name}.`
                        : `${b.guest.name} checked out from Room ${b.room?.roomNumber || '?'}.`,
                timestamp: b.updatedAt
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6)

        const pendingArrivals = recentArrivals.filter((b: any) => b.status === 'RESERVED').length
        const remainingDepartures = todayDepartures

        const categoryLabels = availableRoomsByCategory.map((c: any) =>
            c.category.charAt(0) + c.category.slice(1).toLowerCase()
        ).join(' & ')

        return NextResponse.json({
            todayCheckIns: todayArrivals,
            todayCheckOuts: todayDepartures,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            availableRooms: totalRooms - occupiedRooms,
            pendingHousekeeping: pendingServices,
            activeFoodOrders: activeServices,
            slaBreaches: 0, // In a real system you'd calculate this properly from response times
            occupancyTrend: occupancyTrend >= 0 ? `+${occupancyTrend}%` : `${occupancyTrend}%`,
            onDutyStaff: onDutyStaffFull.length,
            onDutyStaffNames: onDutyStaffFull.map((a: any) => a.staff.user.name),
            onDutyStaffDetails: onDutyStaffFull.map((a: any) => ({
                name: a.staff.user.name,
                department: a.staff.department?.replace('_', ' ') || 'Staff'
            })),
            todayRevenue: todayRevenue._sum.totalAmount || 0,
            monthRevenue: monthlyRevenue._sum.totalAmount || 0,
            pendingArrivals,
            remainingDepartures,
            categoryLabels: categoryLabels || 'Standard & Deluxe',
            recentCheckIns: recentArrivals.map((b: any) => ({
                id: b.id,
                guest: b.guest.name,
                room: b.room.roomNumber,
                roomType: `${b.room.type} (${b.room.roomNumber})`,
                eta: new Date(b.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                status: b.status
            })),
            recentDepartures: recentDepartures.map((b: any) => ({
                id: b.id,
                guest: b.guest.name,
                room: b.room.roomNumber,
                roomType: `${b.room.type} (${b.room.roomNumber})`,
                status: b.status
            })),
            housekeeping: {
                dirty: dirtyRooms + maintenanceRooms,
                inProgress: activeServices,
                clean: cleanRooms,
                priority: priorityCleaning.map((t: any) => ({
                    id: t.id,
                    room: t.room?.roomNumber || '?',
                    status: t.status,
                    assignedTo: t.assignedTo?.user?.name || 'Unassigned'
                }))
            },
            activityLog: allActivity
        })

    } catch (error: any) {
        console.error('[DASHBOARD_STATS_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
