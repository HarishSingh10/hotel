import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

/**
 * Super Admin API to manage subscription tier feature default definitions
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const plans = await prisma.planDefinition.findMany({
            orderBy: { plan: 'asc' }
        })

        // If no plans found, return defaults but don't save yet to avoid side effects on GET
        if (plans.length === 0) {
            return NextResponse.json([
                { plan: 'GOLD', features: ['BASIC_OPS', 'STAFF_MANAGEMENT'], price: 99 },
                { plan: 'PLATINUM', features: ['BASIC_OPS', 'STAFF_MANAGEMENT', 'MARKETING', 'ANALYTICS'], price: 199 },
                { plan: 'DIAMOND', features: ['BASIC_OPS', 'STAFF_MANAGEMENT', 'MARKETING', 'ANALYTICS', 'AI_INSIGHTS', 'PRIORITY_SUPPORT'], price: 399 },
            ])
        }

        return NextResponse.json(plans)
    } catch (error) {
        console.error('[PLANS_GET_ERROR]', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { plan, features, price, description } = body

        if (!plan || !features) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const updatedPlan = await prisma.planDefinition.upsert({
            where: { plan },
            update: {
                features,
                price: parseFloat(price) || 0,
                description
            },
            create: {
                plan,
                features,
                price: parseFloat(price) || 0,
                description
            }
        })

        return NextResponse.json(updatedPlan)
    } catch (error) {
        console.error('[PLANS_POST_ERROR]', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
