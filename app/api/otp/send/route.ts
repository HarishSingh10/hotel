import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/twilio';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const result = await sendOTP(phone);
        
        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            sid: result.sid
        });
    } catch (error: any) {
        console.error('Send OTP Route Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
    }
}
