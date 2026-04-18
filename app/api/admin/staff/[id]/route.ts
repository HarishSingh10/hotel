import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const staff = await prisma.staff.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        status: true,
                        role: true,
                        createdAt: true
                    }
                },
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 30
                },
                leaveRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                performanceScores: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    take: 6
                },
                payrolls: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    take: 12
                }
            }
        })

        if (!staff) return new NextResponse('Staff not found', { status: 404 })

        return NextResponse.json(staff)
    } catch (error) {
        console.error('[STAFF_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { 
            name, email, phone, designation, department, 
            baseSalary, dateOfJoining, employeeId,
            emergencyContactName, emergencyContactPhone, address,
            contractType, workShift, managerName, status,
            annualLeaveBalance, sickLeaveBalance, casualLeaveBalance,
            bankName, accountNumber, ifscCode
        } = body

        const currentStaff = await prisma.staff.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (!currentStaff) return new NextResponse('Staff not found', { status: 404 })

        const updatedStaff = await prisma.$transaction([
            prisma.user.update({
                where: { id: currentStaff.userId },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                    ...(phone && { phone }),
                    ...(status && { status }),
                }
            }),
            prisma.staff.update({
                where: { id: params.id },
                data: {
                    ...(designation && { designation }),
                    ...(department && { department }),
                    ...(baseSalary && { baseSalary: parseFloat(baseSalary) }),
                    ...(dateOfJoining && { dateOfJoining: new Date(dateOfJoining) }),
                    ...(employeeId && { employeeId }),
                    ...(emergencyContactName && { emergencyContactName }),
                    ...(emergencyContactPhone && { emergencyContactPhone }),
                    ...(address && { address }),
                    ...(contractType && { contractType }),
                    ...(workShift && { workShift }),
                    ...(managerName && { managerName }),
                    ...(annualLeaveBalance !== undefined && { annualLeaveBalance: parseInt(annualLeaveBalance) }),
                    ...(sickLeaveBalance !== undefined && { sickLeaveBalance: parseInt(sickLeaveBalance) }),
                    ...(casualLeaveBalance !== undefined && { casualLeaveBalance: parseInt(casualLeaveBalance) }),
                    ...(bankName !== undefined && { bankName }),
                    ...(accountNumber !== undefined && { accountNumber }),
                    ...(ifscCode !== undefined && { ifscCode }),
                }
            })
        ])

        return NextResponse.json(updatedStaff[1])
    } catch (error) {
        console.error('[STAFF_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const propertyId = session.user.propertyId
        const staff = await prisma.staff.findFirst({
            where: {
                id: params.id,
                ...(propertyId ? { propertyId } : {})
            },
            select: { userId: true }
        })

        if (!staff) return new NextResponse('Staff not found', { status: 404 })

        // Delete user (cascade will handle staff profile if configured, but let's be explicit if needed)
        // With MongoDB/Prisma, we usually delete the specific records
        await prisma.$transaction([
            prisma.staff.delete({ where: { id: params.id } }),
            prisma.user.delete({ where: { id: staff.userId } })
        ])

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[STAFF_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
