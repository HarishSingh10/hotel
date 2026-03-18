import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * GET /api/attendance
 * List attendance records (Admin/Manager or own records)
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req)
        if (authResult instanceof NextResponse) return authResult

        const { searchParams } = new URL(req.url)
        const staffId = searchParams.get('staffId')
        const dateStr = searchParams.get('date') // YYYY-MM-DD
        const queryPropertyId = searchParams.get('propertyId')

        const where: any = {}

        // RBAC logic
        if (authResult.user.role === 'STAFF') {
            const staff = await prisma.staff.findUnique({ where: { userId: authResult.user.id } })
            if (!staff) return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
            where.staffId = staff.id
        } else {
            // Admin/Global View
            if (staffId) {
                where.staffId = staffId
            } else {
                // Property based filtering
                let targetPropertyId = authResult.user.propertyId
                if (authResult.user.role === 'SUPER_ADMIN') {
                    targetPropertyId = (queryPropertyId && queryPropertyId !== 'ALL') ? queryPropertyId : null
                }

                if (targetPropertyId) {
                    where.staff = { propertyId: targetPropertyId }
                }
            }
        }

        if (dateStr) {
            const date = new Date(dateStr)
            where.date = {
                gte: startOfDay(date),
                lte: endOfDay(date)
            }
        }

        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                staff: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            count: attendances.length,
            attendances
        })

    } catch (error: any) {
        console.error('[ATTENDANCE_GET_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

/**
 * POST /api/attendance
 * Punch In / Punch Out
 * body: { action: 'PUNCH_IN' | 'PUNCH_OUT', location?: string }
 */
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['STAFF', 'SUPER_ADMIN', 'HOTEL_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { action, location } = body

        if (!action || !['PUNCH_IN', 'PUNCH_OUT'].includes(action)) {
            return NextResponse.json({ error: 'Valid action (PUNCH_IN/PUNCH_OUT) is required' }, { status: 400 })
        }

        const staff = await prisma.staff.findUnique({ where: { userId: authResult.user.id } })
        if (!staff) return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })

        const today = startOfDay(new Date())

        if (action === 'PUNCH_IN') {
            // Check if already punched in today
            const existing = await prisma.attendance.findUnique({
                where: { staffId_date: { staffId: staff.id, date: today } }
            })

            if (existing && existing.punchIn) {
                return NextResponse.json({ error: 'Already punched in for today' }, { status: 400 })
            }

            const attendance = await prisma.attendance.upsert({
                where: { staffId_date: { staffId: staff.id, date: today } },
                update: {
                    punchIn: new Date(),
                    punchInLocation: location,
                    status: 'PRESENT'
                },
                create: {
                    staffId: staff.id,
                    date: today,
                    punchIn: new Date(),
                    punchInLocation: location,
                    status: 'PRESENT'
                }
            })

            return NextResponse.json({ success: true, attendance, message: 'Punched in successfully' })
        } else {
            // PUNCH_OUT
            const existing = await prisma.attendance.findUnique({
                where: { staffId_date: { staffId: staff.id, date: today } }
            })

            if (!existing || !existing.punchIn) {
                return NextResponse.json({ error: 'Cannot punch out without punching in' }, { status: 400 })
            }

            if (existing.punchOut) {
                return NextResponse.json({ error: 'Already punched out for today' }, { status: 400 })
            }

            const punchOutTime = new Date()
            const punchInTime = new Date(existing.punchIn)
            const hoursWorked = (punchOutTime.getTime() - punchInTime.getTime()) / (1000 * 60 * 60)

            const attendance = await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    punchOut: punchOutTime,
                    punchOutLocation: location,
                    hoursWorked: parseFloat(hoursWorked.toFixed(2)),
                    overtimeHours: Math.max(0, hoursWorked - 8) // Overtime calculation based on 8hr shift
                }
            })

            return NextResponse.json({ success: true, attendance, message: 'Punched out successfully' })
        }

    } catch (error: any) {
        console.error('[ATTENDANCE_POST_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
