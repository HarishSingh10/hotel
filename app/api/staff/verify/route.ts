import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const staff = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })

        if (!staff) return new NextResponse('Staff Profile Not Found', { status: 404 })

        await prisma.staff.update({
            where: { id: staff.id },
            data: { verificationRequested: true }
        })

        return NextResponse.json({ success: true, message: 'Verification request sent' })

    } catch (error) {
        console.error("Verification POST API Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
