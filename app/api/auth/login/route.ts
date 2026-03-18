import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-123';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Phone and password are required' },
                { status: 400 }
            );
        }

        // Find user by phone
        const user = await prisma.user.findUnique({
            where: { phone },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                password: true,
                role: true,
                status: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Account is not active' },
                { status: 403 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Ensure Guest profile exists if role is GUEST
        if (user.role === 'GUEST') {
            const guest = await prisma.guest.findUnique({ where: { phone: user.phone } });
            if (!guest) {
                await prisma.guest.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        checkInStatus: 'PENDING'
                    }
                });
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                phone: user.phone,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
