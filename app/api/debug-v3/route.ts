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

        // 1. Force explicit null update one more time for this property
        const fixResult = await prisma.serviceRequest.updateMany({
            where: { 
                propertyId, 
                status: 'PENDING',
                assignedToId: { not: { not: null } }
            },
            data: { assignedToId: null }
        })
        console.log(`[DEBUG-V3] Fixed ${fixResult.count} records for property ${propertyId}`)

        // 2. Run assignment
        const result = await performAutoAssignment(propertyId, 0)

        // 3. Check what's left
        const remaining = await prisma.serviceRequest.findMany({
            where: { propertyId, status: 'PENDING', assignedToId: null }
        })

        console.log = originalLog
        return NextResponse.json({
            propertyId,
            fixResult,
            assignmentResult: result,
            remainingUnassigned: remaining.length,
            debugLogs: logs
        })
    } catch (error: any) {
        console.log = originalLog
        return NextResponse.json({ error: error.message, logs }, { status: 500 })
    }
}
