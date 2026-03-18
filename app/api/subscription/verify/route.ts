import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['HOTEL_ADMIN', 'SUPER_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            plan,
            propertyId
        } = body

        // 1. Verify Signature
        const secret = process.env.RAZORPAY_KEY_SECRET?.trim()
        if (!secret) {
            return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 })
        }

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex')

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }

        // 2. Update Property Plan
        const targetPropertyId = propertyId || authResult.user.propertyId
        
        // Define features based on plan
        let features: string[] = []
        if (plan === 'GOLD') features = ['BASIC_OPS', 'STAFF_MANAGEMENT']
        if (plan === 'PLATINUM') features = ['BASIC_OPS', 'STAFF_MANAGEMENT', 'MARKETING']
        if (plan === 'DIAMOND') features = ['BASIC_OPS', 'STAFF_MANAGEMENT', 'MARKETING', 'ANALYTICS', 'AI_INSIGHTS']

        // Set expiry to 1 month from now
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        await prisma.property.update({
            where: { id: targetPropertyId },
            data: {
                plan: plan,
                features: features,
                planExpiresAt: expiresAt
            } as any
        })

        // 3. Log Payment (Optional: Add a Payment model in prisma if needed, but for now we update property)
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully upgraded to ${plan} plan` 
        })

    } catch (error: any) {
        console.error('[SUBSCRIPTION_VERIFY_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
    }
}
