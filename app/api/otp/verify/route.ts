import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/twilio';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-123';

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
        }

        const verification = await verifyOTP(phone, code);

        if (verification.status !== 'approved') {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // OTP is valid, now find or create the user
        let user = await prisma.user.findUnique({
            where: { phone },
        });

        // If user doesn't exist, we can't fully "log in" yet if this is just verification
        // But for mobile app flow, we usually auto-register or return a token if exists
        
        if (!user) {
            return NextResponse.json({ 
                success: true, 
                verified: true,
                isNewUser: true,
                message: 'Phone verified. Please complete signup.'
            });
        }

        // Generate JWT token for existing user
        const token = jwt.sign(
            {
                userId: user.id,
                phone: user.phone,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            verified: true,
            isNewUser: false,
            token,
            user: userWithoutPassword,
            message: 'Logged in successfully'
        });
    } catch (error: any) {
        console.error('Verify OTP Route Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 500 });
    }
}
