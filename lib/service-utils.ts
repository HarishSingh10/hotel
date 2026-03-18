import { prisma } from './db'

export const typeToDeptMap: Record<string, string> = {
    'HOUSEKEEPING': 'HOUSEKEEPING',
    'LAUNDRY': 'HOUSEKEEPING',
    'FOOD_ORDER': 'KITCHEN',
    'ROOM_SERVICE': 'ROOM_SERVICE',
    'MAINTENANCE': 'MAINTENANCE',
    'CONCIERGE': 'FRONT_DESK',
    'SPA': 'HOUSEKEEPING' // Fallback
}

/**
 * Automatically assign unassigned service requests to staff based on domain/department.
 * If minAgeSeconds is provided, only requests older than that will be processed.
 */
export async function performAutoAssignment(propertyId: string, minAgeSeconds?: number) {
    if (!propertyId || propertyId === 'ALL') return { assignedCount: 0, totalProcessed: 0, assignments: [] }

    const where: any = {
        propertyId,
        status: 'PENDING',
        assignedToId: null
    }

    if (minAgeSeconds) {
        const threshold = new Date(Date.now() - minAgeSeconds * 1000)
        where.createdAt = { lte: threshold }
    }

    // 1. Fetch unassigned service requests
    const requests = await prisma.serviceRequest.findMany({
        where
    })

    if (requests.length === 0) {
        return { assignedCount: 0, totalProcessed: 0, assignments: [] }
    }

    // 2. Fetch all STAFF for this property
    const staffList = await prisma.staff.findMany({
        where: { propertyId },
        include: { user: true }
    })

    let assignedCount = 0
    const assignments: any[] = []

    const updatePromises = requests.map(request => {
        const targetDept = typeToDeptMap[request.type]
        const availableStaff = staffList.filter(s => s.department === targetDept)

        if (availableStaff.length > 0) {
            const staff = availableStaff[Math.floor(Math.random() * availableStaff.length)]
            assignedCount++
            assignments.push({
                requestId: request.id,
                requestTitle: request.title,
                assignedTo: staff.user?.name || 'Unknown'
            })
            
            return prisma.serviceRequest.update({
                where: { id: request.id },
                data: {
                    assignedToId: staff.id,
                    status: 'ACCEPTED',
                    acceptedAt: new Date()
                }
            })
        }
        return Promise.resolve(null)
    })

    await Promise.all(updatePromises)

    return {
        assignedCount,
        totalProcessed: requests.length,
        assignments
    }
}
