'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { planHasFeature, planMeetsRequirement, type PlanTier } from '@/lib/plan-features'

export type PermissionMap = Record<string, boolean>

interface UsePermissionsReturn {
    // Role-based
    permissions: PermissionMap
    can: (permissionId: string) => boolean
    isAdmin: boolean
    role: string

    // Plan-based
    plan: string
    hasFeature: (featureKey: string) => boolean
    planMeets: (minPlan: PlanTier) => boolean

    loading: boolean
}

let _cache: { propertyId: string; role: string; data: PermissionMap } | null = null

export function usePermissions(): UsePermissionsReturn {
    const { data: session } = useSession()
    const [permissions, setPermissions] = useState<PermissionMap>({})
    const [plan, setPlan] = useState<string>('BASE')
    const [loading, setLoading] = useState(true)

    const role = session?.user?.role ?? ''
    const propertyId = session?.user?.propertyId ?? ''
    const isAdmin = role === 'SUPER_ADMIN' || role === 'HOTEL_ADMIN'

    const fetchPermissions = useCallback(async () => {
        if (!propertyId || propertyId === 'ALL') {
            setLoading(false)
            return
        }

        // Admins have all permissions — no need to fetch
        if (isAdmin) {
            setLoading(false)
            return
        }

        // Use cache if same property+role
        if (_cache && _cache.propertyId === propertyId && _cache.role === role) {
            setPermissions(_cache.data)
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/admin/settings/roles?propertyId=${propertyId}`)
            if (res.ok) {
                const json = await res.json()
                const rolePerms = (json.rolePermissions ?? []).find(
                    (rp: any) => rp.role === role
                )
                const perms: PermissionMap = rolePerms?.permissions ?? {}
                _cache = { propertyId, role, data: perms }
                setPermissions(perms)
            }
        } catch { /* silent */ } finally {
            setLoading(false)
        }
    }, [propertyId, role, isAdmin])

    // Fetch property plan
    const fetchPlan = useCallback(async () => {
        if (!propertyId || propertyId === 'ALL') return
        try {
            const res = await fetch(`/api/admin/settings/property?propertyId=${propertyId}`)
            if (res.ok) {
                const json = await res.json()
                const plan = json.data?.plan ?? json.property?.plan
                if (plan) setPlan(plan)
            }
        } catch { /* silent */ }
    }, [propertyId])

    useEffect(() => {
        if (session) {
            fetchPermissions()
            fetchPlan()
        }
    }, [session, fetchPermissions, fetchPlan])

    const can = useCallback((permissionId: string): boolean => {
        if (isAdmin) return true
        return !!permissions[permissionId]
    }, [isAdmin, permissions])

    const hasFeature = useCallback((featureKey: string): boolean => {
        if (role === 'SUPER_ADMIN') return true
        return planHasFeature(plan, featureKey)
    }, [plan, role])

    const planMeets = useCallback((minPlan: PlanTier): boolean => {
        if (role === 'SUPER_ADMIN') return true
        return planMeetsRequirement(plan, minPlan)
    }, [plan, role])

    return { permissions, can, isAdmin, role, plan, hasFeature, planMeets, loading }
}
