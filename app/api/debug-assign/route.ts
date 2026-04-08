import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { performAutoAssignment } from '@/lib/service-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args: any[]) => {
        logs.push(args.join(' '))
        originalLog(...args)
    }

    try {
        const { searchParams } = new URL(request.url)
        const propertyId = searchParams.get('propertyId')
        
        if (!propertyId) return NextResponse.json({ error: 'Missing propertyId' })

        const result = await performAutoAssignment(propertyId, 0)

        console.log = originalLog
        return NextResponse.json({
            propertyId,
            assignmentResult: result,
            debugLogs: logs
        })
    } catch (error: any) {
        console.log = originalLog
        return NextResponse.json({ error: error.message, logs }, { status: 500 })
    }
}
