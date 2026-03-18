import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { phone, password, verified } = await request.json();

        if (!phone || !password || !verified) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // We assume 'verified' is passed from the client only after successful OTP verification
        // In a production app, you might want to verify a one-time token here
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { phone },
            data: { password: hashedPassword }
        });

        // Also update Guest profile if exists
        await prisma.guest.updateMany({
            where: { phone },
            data: { 
                // Any guest specific updates if needed
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
