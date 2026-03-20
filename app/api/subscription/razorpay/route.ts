import { NextRequest, NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const PLAN_PRICES: Record<string, number> = {
    'GOLD': 7999,      // ~₹99
    'PLATINUM': 15999, // ~₹199
    'DIAMOND': 31999   // ~₹399
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['HOTEL_ADMIN', 'SUPER_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { plan, propertyId } = body

        if (!plan || !PLAN_PRICES[plan]) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
        }

        const targetPropertyId = propertyId || authResult.user.propertyId
        if (!targetPropertyId) {
            return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
        }

        const property = await prisma.property.findUnique({
            where: { id: targetPropertyId }
        })

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }

        const amountInPaisa = PLAN_PRICES[plan] * 100

        const options = {
            amount: amountInPaisa,
            currency: 'INR',
            receipt: `sub_${targetPropertyId.slice(-10)}_${Date.now()}`,
            notes: {
                propertyId: targetPropertyId,
                plan: plan,
                type: 'SUBSCRIPTION_UPGRADE'
            }
        }

        const order = await razorpay.orders.create(options)

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID?.trim()
        })

    } catch (error: any) {
        console.error('[SUBSCRIPTION_ORDER_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
    }
}
