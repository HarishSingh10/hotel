import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, phone, password, role = 'GUEST', hotelName, hotelAddress, latitude, longitude, plan = 'GOLD' } = body

        // Validation
        if (!name || !email || !phone || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (role === 'HOTEL_ADMIN' && !hotelName) {
            return NextResponse.json({ error: 'Hotel name is required for hotel accounts' }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email or phone already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 10)

        // Create user
        // Create user and guest profile in transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password: hashedPassword,
                    role: role as any,
                    status: 'ACTIVE'
                },
            })

            let propertyId = null

            // If registering as HOTEL_ADMIN, create the Property immediately
            if (role === 'HOTEL_ADMIN' && hotelName) {
                const property = await tx.property.create({
                    data: {
                        name: hotelName,
                        address: hotelAddress || 'Address not provided',
                        phone: phone,
                        email: email,
                        latitude: latitude || null,
                        longitude: longitude || null,
                        plan: 'GOLD', // Always start as GOLD, upgrade after payment
                        features: ["BASIC_OPS", "STAFF_MANAGEMENT"],
                        ownerIds: [user.id] // Link user as owner
                    } as any
                })

                propertyId = property.id

                // Also update user's ownedPropertyIds for easier access
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        ownedPropertyIds: [property.id]
                    }
                })
            }

            // Create Guest profile if role is GUEST
            if (role === 'GUEST') {
                await tx.guest.create({
                    data: {
                        name,
                        email,
                        phone,
                        checkInStatus: 'PENDING'
                    }
                })
            }

            return { user, propertyId }
        })

        // Generate token for auto-login
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-123'
        const token = jwt.sign(
            {
                userId: result.user.id,
                phone: result.user.phone,
                role: result.user.role,
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        )

        return NextResponse.json({
            success: true,
            user: result.user,
            propertyId: result.propertyId,
            token,
            message: 'User registered successfully'
        }, { status: 201 })

    } catch (error: any) {
        console.error('[REGISTER_ERROR]', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
