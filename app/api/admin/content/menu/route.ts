import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/content/menu
 * Fetch menu items for the current property context
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'])
        if (authResult instanceof NextResponse) return authResult

        const { searchParams } = new URL(req.url)
        const propertyId = searchParams.get('propertyId') || authResult.user.propertyId

        if (!propertyId || propertyId === 'ALL') {
            return NextResponse.json({ success: true, menuItems: [] })
        }

        const menuItems = await prisma.menuItem.findMany({
            where: { propertyId },
            orderBy: { category: 'asc' }
        })

        return NextResponse.json({ success: true, menuItems })

    } catch (error: any) {
        console.error('[MENU_GET_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

/**
 * POST /api/admin/content/menu
 * Create or Update a menu item
 */
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'])
        if (authResult instanceof NextResponse) return authResult

        const body = await req.json()
        const { id, propertyId, name, description, category, price, isVeg, isAvailable, image } = body

        const targetPropertyId = propertyId || authResult.user.propertyId

        if (!targetPropertyId) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
        }

        // Verify propertyId is authorized for the user
        if (authResult.user.role !== 'SUPER_ADMIN' && authResult.user.propertyId !== targetPropertyId) {
            return NextResponse.json({ error: 'Unauthorized for this property' }, { status: 403 })
        }

        const data = {
            name,
            description,
            category,
            price: parseFloat(price.toString()),
            isVeg: !!isVeg,
            isAvailable: !!isAvailable,
            image,
            propertyId: targetPropertyId
        }

        let menuItem
        if (id) {
            menuItem = await prisma.menuItem.update({
                where: { id },
                data
            })
        } else {
            menuItem = await prisma.menuItem.create({
                data
            })
        }

        return NextResponse.json({ success: true, menuItem })

    } catch (error: any) {
        console.error('[MENU_POST_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
