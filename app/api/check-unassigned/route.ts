import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const all = await prisma.serviceRequest.findMany({
            where: { status: 'PENDING' }
        })
        
        const unassigned = all.filter(r => !r.assignedToId)
        
        return NextResponse.json({
            totalPending: all.length,
            unassignedCount: unassigned.length,
            unassigned: unassigned.map(r => ({
                id: r.id,
                title: r.title,
                propertyId: r.propertyId,
                assignedToId: r.assignedToId
            }))
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
