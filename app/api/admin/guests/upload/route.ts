import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    const allowed = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (!session || !allowed.includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const side = formData.get('side') as 'front' | 'back'
        const guestId = formData.get('guestId') as string

        if (!file || !side || !guestId) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Read file as buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Store locally in public/uploads/documents/
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `${guestId}_${side}_${Date.now()}.${ext}`
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)

        const publicUrl = `/uploads/documents/${filename}`

        // Update guest record
        await prisma.guest.update({
            where: { id: guestId },
            data: {
                ...(side === 'front' ? { idDocumentFront: publicUrl } : { idDocumentBack: publicUrl }),
                // Auto-advance status to LINK_OPENED if still PENDING
                checkInStatus: 'LINK_OPENED',
            }
        })

        return NextResponse.json({ url: publicUrl, success: true })
    } catch (error) {
        console.error('[UPLOAD_DOC]', error)
        return new NextResponse('Upload failed', { status: 500 })
    }
}
