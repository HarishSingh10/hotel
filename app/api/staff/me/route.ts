import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    const allowedRoles = ['STAFF', 'MANAGER', 'RECEPTIONIST', 'HOTEL_ADMIN', 'SUPER_ADMIN']
    if (!session || !allowedRoles.includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        // 1. Get Staff Profile
        // 1. Get Staff Profile - for managers/admins, just get their user data if no staff profile exists
        let staff = await prisma.staff.findUnique({
            where: { userId: session.user.id },
            include: { user: true }
        })

        if (!staff && ['MANAGER', 'HOTEL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            // Create a temporary mock staff object for managers/admins to view the portal
            staff = {
                id: 'admin-view',
                userId: session.user.id,
                department: 'MANAGEMENT',
                designation: session.user.role,
                employeeId: 'ADMIN',
                status: 'ACTIVE',
                user: {
                    name: session.user.name,
                    email: session.user.email
                }
            } as any
        }

        if (!staff) {
            return new NextResponse('Staff Profile Not Found', { status: 404 })
        }

        // Fetch all related data in parallel
        const [attendance, tasks, unreadNotifications, unreadMessages, systemAlerts] = await Promise.all([
            // 2. Today's Attendance
            prisma.attendance.findFirst({
                where: {
                    staffId: staff.id,
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),
            // 3. Assigned Tasks
            staff.id === 'admin-view' 
                ? Promise.resolve([]) 
                : prisma.serviceRequest.findMany({
                    where: {
                        assignedToId: staff.id,
                        status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] }
                    },
                    include: { room: true },
                    orderBy: { priority: 'desc' }
                }),
            // 4. Unread Counts
            prisma.inAppNotification.count({
                where: { userId: session.user.id, isRead: false }
            }),
            prisma.message.count({
                where: { receiverId: session.user.id, isRead: false }
            }),
            // 5. Recent System Alerts
            prisma.systemAlert.findMany({
                where: { propertyId: staff.propertyId },
                orderBy: { timestamp: 'desc' },
                take: 3
            })
        ])

        return NextResponse.json({
            profile: staff,
            attendance,
            tasks,
            systemAlerts,
            unreadCounts: {
                notifications: unreadNotifications,
                messages: unreadMessages
            }
        })

    } catch (error) {
        console.error("Staff Me API Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
