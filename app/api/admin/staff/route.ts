import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryPropertyId = searchParams.get('propertyId')

    let where: any = {}

    // RBAC: If Super Admin, they can filter by any property or see all. 
    // Otherwise, they are locked to their own property.
    if (session.user.role === 'SUPER_ADMIN') {
        if (queryPropertyId && queryPropertyId !== 'ALL') {
            where.propertyId = queryPropertyId
        }
    } else {
        const propertyId = session.user.propertyId
        if (!propertyId) return NextResponse.json([])
        where.propertyId = propertyId
    }

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const staff = await prisma.staff.findMany({
            where: where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        status: true,
                        role: true
                    }
                },
                attendances: {
                    where: {
                        date: today
                    },
                    take: 1
                }
            },
            orderBy: { user: { name: 'asc' } }
        })

        const formatted = staff.map(s => {
            const attendance = s.attendances[0]
            let dutyStatus = 'OFF_DUTY'

            if (attendance) {
                if (attendance.punchIn && !attendance.punchOut) {
                    dutyStatus = 'ON_DUTY'
                } else if (attendance.punchOut) {
                    dutyStatus = 'PUNCHED_OUT'
                }
            } else {
                dutyStatus = 'NOT_STARTED'
            }

            return {
                id: s.id,
                name: s.user.name,
                email: s.user.email,
                phone: s.user.phone,
                department: s.department,
                role: s.designation,
                userRole: s.user.role,
                status: s.user.status,
                dutyStatus: dutyStatus,
                salary: session.user.role === 'SUPER_ADMIN' ? s.baseSalary : '***',
                location: 'Main Property'
            }
        })

        return NextResponse.json(formatted)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, email, phone, role, department, salary, password, userRole, propertyId: bodyPropertyId } = body

        let targetPropertyId = session.user.propertyId
        if (session.user.role === 'SUPER_ADMIN' && bodyPropertyId) {
            targetPropertyId = bodyPropertyId
        }

        if (!targetPropertyId) return new NextResponse('Missing property ID', { status: 400 })

        // 1. Create User
        const hashedPassword = await hash(password || '123456', 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: userRole || 'STAFF',
                status: 'ACTIVE',
                workplaceId: targetPropertyId
            }
        })

        // 2. Create Staff Profile
        const staff = await prisma.staff.create({
            data: {
                userId: user.id,
                propertyId: targetPropertyId,
                employeeId: `EMP-${Date.now().toString().slice(-6)}`,
                department: department || 'FRONT_DESK',
                designation: role || 'Member',
                baseSalary: parseFloat(salary) || 0,
                dateOfJoining: new Date()
            }
        })

        return NextResponse.json(staff)
    } catch (error: any) {
        console.error(error)
        if (error.code === 'P2002') {
            return new NextResponse('User with this email or phone already exists', { status: 400 })
        }
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
