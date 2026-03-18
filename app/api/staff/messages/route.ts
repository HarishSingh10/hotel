import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        // Fetch direct messages where user is sender or receiver
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: session.user.id },
                    { receiverId: session.user.id }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error("Messages GET Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await request.json()
        const { receiverId, content, category, type, serviceRequestId } = body
        
        const newMessage = await prisma.message.create({
            data: {
                senderId: session.user.id,
                receiverId,
                serviceRequestId,
                content,
                category: category || 'CHAT',
                type: type || 'TEXT'
            }
        })

        return NextResponse.json(newMessage)
    } catch (error) {
        console.error("Messages POST Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
