import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        console.log('Starting ServiceRequest migration via API...')
        
        // This explicitly sets assignedToId to null for ANY PENDING request where it's not a valid ID
        // In MongoDB, we want to target records where the field is missing OR null
        const allRequests = await prisma.serviceRequest.findMany({
            where: { status: 'PENDING' }
        })
        
        let count = 0
        for (const req of allRequests) {
            // If assignedToId is not present or is null, we force set it to null
            if (!req.assignedToId) {
                await prisma.serviceRequest.update({
                    where: { id: req.id },
                    data: { assignedToId: null }
                })
                count++
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            message: `Migration complete. Updated ${count} requests to explicit null assignment.` 
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
