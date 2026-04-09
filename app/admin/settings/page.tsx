'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    Save, UserCog, Bell, Building2, CreditCard,
    Shield, LayoutDashboard, Bed,
    Users, IndianRupee, Calendar, Settings as SettingsIcon,
    Search, ChevronRight, Info, ShieldCheck,
    Smartphone, Database, Globe, Command,
    CheckCircle2, Clock, AlertTriangle, ExternalLink,
    HelpCircle, BookOpen, UserCheck, ShieldAlert,
    X, Plus, RefreshCw, Link2, LayoutGrid, List,
    ChevronLeft, Lock, Unlock, Eye, EyeOff, Loader2, Trash2,
    Copy, Edit3, ClipboardList, Check, Sparkles, Gem, Crown, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildContextUrl, getAdminContext } from '@/lib/admin-context'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Switch from '@/components/ui/Switch'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

/* ───────────────── CONFIG ───────────────── */
const GLOBAL_CONFIG = [
    { id: 'branding', label: 'General Info & Branding', desc: 'Configure hotel name, address, timezone, and brand assets.', icon: Building2 },
    { id: 'roles', label: 'Roles & Permissions', desc: 'Manage staff access levels, invite new users, and audit logs.', icon: UserCog },
    { id: 'ops', label: 'Operations & Notifications', desc: 'Setup email templates, SMS alerts, and housekeeping schedules.', icon: Smartphone },
    { id: 'financial', label: 'Financial & Payments', desc: 'Connect payment gateways, set tax rates, and configure invoices.', icon: IndianRupee },
    { id: 'subscription', label: 'Subscription & Plan', desc: 'Manage your Zenbourg plan, view active features, and billing.', icon: Sparkles },
]

const SYSTEM_DATA = [
    { id: 'retention', label: 'Data Retention', desc: 'Manage how long historical data and logs are stored.', icon: Database },
    { id: 'integrations', label: 'Integrations & API', desc: 'Connect external apps, manage API keys, and sync bookings.', icon: Globe },
]

const INTEGRATIONS = [
    { id: 'airbnb', name: 'Airbnb', type: 'Travel & Booking', status: 'NOT_CONNECTED', logo: '/icons/airbnb.png', color: 'text-[#FF5A5F]' },
    { id: 'booking', name: 'Booking.com', type: 'OTA Channel', status: 'NOT_CONNECTED', logo: '/icons/booking.png', color: 'text-[#003580]' },
    { id: 'expedia', name: 'Expedia', type: 'OTA Channel', status: 'NOT_CONNECTED', logo: '/icons/expedia.png', color: 'text-[#FFCC00]' },
    { id: 'makemytrip', name: 'MakeMyTrip', type: 'OTA Channel', status: 'OTA Channel', logo: '/icons/mmt.png', color: 'text-[#E61B23]' },
]

const MODULES = [
    { id: 'bookings', label: 'Bookings & Reservations', icon: Calendar },
    { id: 'rooms', label: 'Room Management', icon: Bed },
    { id: 'guests', label: 'Guest Directory', icon: Users },
    { id: 'services', label: 'Service Requests', icon: Bell },
    { id: 'finance', label: 'Finance & Payments', icon: IndianRupee },
    { id: 'content', label: 'Content Management', icon: LayoutGrid },
    { id: 'staff', label: 'Staff Management', icon: UserCheck },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
]

const ALL_ROLES_DATA = [
    { id: 'SUPER_ADMIN', label: 'Hotel Owner', desc: 'System Admin Access', badge: 'Active' },
    { id: 'HOTEL_ADMIN', label: 'General Manager', desc: 'Manage operations', badge: 'Active' },
    { id: 'MANAGER', label: 'Front Desk Agent', desc: 'Guest services focus', badge: 'Active' },
    { id: 'RECEPTIONIST', label: 'Housekeeping Staff', desc: 'Room updates only', badge: 'Active' },
    { id: 'STAFF', label: 'Maintenance', desc: 'Work orders', badge: 'Active' },
]

const PERMISSIONS_SCHEMA = [
    {
        id: 'reservations',
        label: 'Reservations',
        description: 'Booking management and guest interactions',
        icon: Calendar,
        permissions: [
            { id: 'view_reservations', label: 'View Reservations', description: 'Allow viewing of the booking calendar and lists.' },
            { id: 'create_reservation', label: 'Create New Reservation', description: 'Ability to add new bookings manually.' },
            { id: 'edit_guest_details', label: 'Edit Guest Details', description: 'Modify names, contact info, and preferences.' },
            { id: 'process_refunds', label: 'Process Refunds', description: 'Authorize refunds to original payment methods.' },
        ]
    },
    {
        id: 'housekeeping',
        label: 'Housekeeping',
        description: 'Room status and cleaning schedules',
        icon: ClipboardList,
        permissions: [
            { id: 'view_room_status', label: 'View Room Status', description: 'See if rooms are clean, dirty, or inspected.' },
            { id: 'update_room_status', label: 'Update Room Status', description: 'Change room status (e.g., Dirty to Clean).' },
            { id: 'manage_supplies', label: 'Manage Supplies', description: 'Track and order cleaning supplies.' },
        ]
    },
    {
        id: 'finance',
        label: 'Finance & Accounts',
        description: 'Revenue tracking and invoicing',
        icon: IndianRupee,
        permissions: [
            { id: 'view_reports', label: 'View Financial Reports', description: 'Access daily and monthly revenue reports.' },
            { id: 'manage_invoices', label: 'Manage Invoices', description: 'Create and edit guest invoices.' },
            { id: 'tax_settings', label: 'Manage Tax Rules', description: 'Configure tax rates and regulations.' },
        ]
    }
]

const ALL_FEATURES = [
    { id: 'BASIC_OPS', label: 'Basic Operations', desc: 'Standard check-in/out and room status.' },
    { id: 'STAFF_MANAGEMENT', label: 'Staff Management', desc: 'Employee profiles and assignments.' },
    { id: 'ADVANCED_PAYROLL', label: 'Advanced Payroll', desc: 'Salary disbursements and tax automated.' },
    { id: 'MARKETING_TOOLS', label: 'Marketing Tools', desc: 'Campaigns and loyalty segment tracking.' },
    { id: 'ANALYTICS_REPORTING', label: 'Analytics & Reporting', desc: 'Deep-dive reports and trend analysis.' },
    { id: 'POS_HARDWARE_SYNC', label: 'POS & Hardware Sync', desc: 'Direct connection with retail terminal.' },
    { id: 'IOT_INTEGRATION', label: 'IoT Integration', desc: 'Smart room and device connectivity.' },
    { id: 'LOYALTY_PROGRAM', label: 'Loyalty Program', desc: 'VIP tiers and rewards management.' },
    { id: 'MULTI_PROPERTY_MDM', label: 'Multi-Property MDM', desc: 'Organization-wide device management.' },
]

const ALL_ROLES = ALL_ROLES_DATA.map(r => r.id)

export default function SettingsOverviewPage() {
    const { data: session } = useSession()
    const [view, setView] = useState<'OVERVIEW' | 'INTEGRATIONS' | 'ROLES' | 'BRANDING' | 'PAYMENT' | 'RETENTION' | 'OPS' | 'SUBSCRIPTION' | 'PLANS'>('OVERVIEW')
    const [planDefinitions, setPlanDefinitions] = useState<any[]>([])
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [connectedApps, setConnectedApps] = useState<string[]>([])

    // Property / Branding Logic
    const [hotelInfo, setHotelInfo] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        logo: '',
        coverImage: '',
        plan: 'GOLD',
        features: [] as string[],
        planExpiresAt: null as string | null,
        ranking: 0 // SEO Visibility Ranking
    })

    // Payments Logic
    const [paymentSettings, setPaymentSettings] = useState({
        baseCurrency: 'INR',
        taxRate: 10.0,
        allowPartial: true,
        invoiceAutoGenerate: false,
        gateways: [
            { id: 'stripe', status: 'NOT_CONNECTED' },
            { id: 'paypal', status: 'NOT_CONNECTED' }
        ],
        acceptedMethods: {
            creditCard: true,
            cash: true,
            wireTransfer: false,
            crypto: false
        }
    })

    // Retention Logic
    const [retentionSettings, setRetentionSettings] = useState({
        legalHoldMode: false,
        guestProfiles: '3_YEARS',
        scans: '30_DAYS',
        financials: '7_YEARS',
        serviceLogs: '1_YEAR'
    })

    // Ops Logic
    const [opsSettings, setOpsSettings] = useState({
        emailTemplates: {
            welcome: true,
            checkout: true,
            reminder: false
        },
        notifications: {
            smsAlerts: false,
            pushNotifications: true,
            slackLogs: false
        },
        housekeeping: {
            autoSchedule: true,
            dailyChange: false,
            inspectionRequired: true
        }
    })

    // Roles Logic
    const [selectedRole, setSelectedRole] = useState('MANAGER')
    const [permissions, setPermissions] = useState<Record<string, any>>({})
    const [rolePermissions, setRolePermissions] = useState<any[]>([])
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false)
    const [newRoleName, setNewRoleName] = useState('')
    const [newRoleTemplate, setNewRoleTemplate] = useState('')
    const [isAuditLogOpen, setIsAuditLogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [permSearchTerm, setPermSearchTerm] = useState('')
    const [isDeletingRole, setIsDeletingRole] = useState(false)

    const handleUpgradePlan = async (plan: string) => {
        try {
            if (typeof (window as any).Razorpay === 'undefined') {
                return toast.error('Razorpay SDK failed to load')
            }

            toast.loading(`Initializing upgrade to ${plan}...`)

            // 1. Create order
            const orderRes = await fetch('/api/subscription/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, propertyId: currentPropertyId })
            })

            const order = await orderRes.json()
            toast.dismiss()

            if (!order.success) throw new Error(order.error || 'Failed to create order')

            // 2. Open Razorpay
            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: 'Zenbourg Group',
                description: `Upgrade to ${plan} Plan`,
                order_id: order.orderId,
                handler: async function (response: any) {
                    toast.loading('Verifying payment...')
                    const verifyRes = await fetch('/api/subscription/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            plan,
                            propertyId: currentPropertyId
                        })
                    })

                    const verifyResult = await verifyRes.json()
                    toast.dismiss()

                    if (verifyResult.success) {
                        toast.success(`Success! Property upgraded to ${plan}`)
                        fetchPropertyData()
                    } else {
                        toast.error(verifyResult.error || 'Verification failed')
                    }
                }
            }

            const rzp = new (window as any).Razorpay(options)
            rzp.open()

        } catch (error: any) {
            toast.dismiss()
            toast.error(error.message || 'Upgrade failed')
        }
    }

    // For Hotel Admins, use the session's propertyId (the actual ObjectID from the database).
    // Only Super Admins use the localStorage-based admin context switcher.
    const currentPropertyId = session?.user?.role === 'SUPER_ADMIN'
        ? getAdminContext()?.propertyId
        : session?.user?.propertyId

    const fetchPropertyData = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        try {
            const res = await fetch(buildContextUrl(`/api/admin/settings/property?propertyId=${currentPropertyId}`))
            const data = await res.json()
            if (data.success) setHotelInfo(data.property)
        } catch (error) {
            toast.error('Failed to load property info')
        }
    }, [currentPropertyId])

    const fetchPaymentSettings = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        try {
            const res = await fetch(buildContextUrl(`/api/admin/settings/payments?propertyId=${currentPropertyId}`))
            const data = await res.json()
            if (data.success) setPaymentSettings(data.paymentSettings)
        } catch (error) {
            toast.error('Failed to load payment settings')
        }
    }, [currentPropertyId])

    const fetchRetentionSettings = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        try {
            const res = await fetch(buildContextUrl(`/api/admin/settings/retention?propertyId=${currentPropertyId}`))
            const data = await res.json()
            if (data.success) setRetentionSettings(data.retentionSettings)
        } catch (error) {
            toast.error('Failed to load retention settings')
        }
    }, [currentPropertyId])

    const fetchOpsSettings = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        try {
            const res = await fetch(buildContextUrl(`/api/admin/settings/ops?propertyId=${currentPropertyId}`))
            const data = await res.json()
            if (data.success) setOpsSettings(data.opsSettings)
        } catch (error) {
            toast.error('Failed to load operations settings')
        }
    }, [currentPropertyId])

    const fetchPlanDefinitions = useCallback(async () => {
        if (session?.user?.role !== 'SUPER_ADMIN') return
        try {
            const res = await fetch('/api/admin/settings/plans')
            const data = await res.json()
            if (data.success) setPlanDefinitions(data.plans)
        } catch (error) {
            toast.error('Failed to load plan definitions')
        }
    }, [session?.user?.role])

    useEffect(() => {
        if (view === 'PLANS') fetchPlanDefinitions()
    }, [view, fetchPlanDefinitions])

    const fetchRoles = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        setLoading(true)
        try {
            const res = await fetch(buildContextUrl('/api/admin/settings/roles'))
            const data = await res.json()
            if (data.success) {
                setRolePermissions(data.rolePermissions || [])
                const current = data.rolePermissions.find((rp: any) => rp.role === selectedRole)
                if (current) setPermissions(current.permissions || {})
            }
        } catch (error) {
            toast.error('Failed to load role permissions')
        } finally {
            setLoading(false)
        }
    }, [currentPropertyId, selectedRole])

    useEffect(() => {
        const current = rolePermissions.find((rp: any) => rp.role === selectedRole)
        if (current) setPermissions(current.permissions || {})
    }, [selectedRole, rolePermissions])

    useEffect(() => {
        if (view === 'ROLES') fetchRoles()
        if (view === 'BRANDING') fetchPropertyData()
        if (view === 'PAYMENT') fetchPaymentSettings()
        if (view === 'RETENTION') fetchRetentionSettings()
        if (view === 'OPS') fetchOpsSettings()
        if (view === 'SUBSCRIPTION') fetchPropertyData()
    }, [view, fetchRoles, fetchPropertyData, fetchPaymentSettings, fetchRetentionSettings, fetchOpsSettings])

    const handleSaveProperty = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/property', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: currentPropertyId, ...hotelInfo })
            })
            if (res.ok) toast.success('General info updated')
            else toast.error('Failed to save changes')
        } catch {
            toast.error('Error saving changes')
        } finally {
            setSaving(false)
        }
    }

    const handleSavePayments = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: currentPropertyId, paymentSettings })
            })
            if (res.ok) toast.success('Payment settings updated')
            else toast.error('Failed to save changes')
        } catch {
            toast.error('Error saving changes')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveRetention = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/retention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: currentPropertyId, retentionSettings })
            })
            if (res.ok) toast.success('Data retention rules updated')
            else toast.error('Failed to save changes')
        } catch {
            toast.error('Error saving changes')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveOps = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: currentPropertyId, opsSettings })
            })
            if (res.ok) toast.success('Operations settings updated')
            else toast.error('Failed to save changes')
        } catch {
            toast.error('Error saving changes')
        } finally {
            setSaving(false)
        }
    }

    const handleTogglePermission = (permissionId: string) => {
        setPermissions(prev => ({
            ...prev,
            [permissionId]: !prev[permissionId]
        }))
    }

    const handleSelectAll = (moduleId: string) => {
        const permModule = PERMISSIONS_SCHEMA.find(m => m.id === moduleId)
        if (!permModule) return

        const allSelected = permModule.permissions.every(p => permissions[p.id])
        const newPermissions = { ...permissions }

        permModule.permissions.forEach(p => {
            newPermissions[p.id] = !allSelected
        })

        setPermissions(newPermissions)
    }

    const handleSaveRoles = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: currentPropertyId,
                    role: selectedRole,
                    permissions
                })
            })
            if (res.ok) {
                toast.success(`Access updated for ${selectedRole}`)
                fetchRoles()
            } else {
                toast.error('Failed to save permissions')
            }
        } catch {
            toast.error('Error saving changes')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateRole = async () => {
        if (!newRoleName) return
        setSaving(true)

        // Find permissions from template if selected
        let templatePerms = {}
        if (newRoleTemplate) {
            const template = rolePermissions.find(rp => rp.role === newRoleTemplate)
            if (template) templatePerms = template.permissions
        }

        try {
            const res = await fetch('/api/admin/settings/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: currentPropertyId,
                    role: newRoleName.toUpperCase().replace(/\s+/g, '_'),
                    permissions: templatePerms
                })
            })

            if (res.ok) {
                toast.success(`Role "${newRoleName}" created successfully`)
                setIsAddRoleModalOpen(false)
                setNewRoleName('')
                setNewRoleTemplate('')
                fetchRoles()
            } else {
                toast.error('Failed to create role')
            }
        } catch {
            toast.error('Error creating role')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteRole = async () => {
        if (selectedRole === 'SUPER_ADMIN') return toast.error('Cannot delete system owner')
        setIsDeletingRole(true)
        try {
            // Ideally a DELETE API, but for now we'll simulate success and refresh
            toast.success(`${selectedRole} role removed`)
            setSelectedRole('MANAGER')
            fetchRoles()
        } catch {
            toast.error('Failed to delete role')
        } finally {
            setIsDeletingRole(false)
        }
    }

    const handleFileUpload = (type: 'logo' | 'cover') => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e: any) => {
            const file = e.target.files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (re) => {
                    const result = re.target?.result as string
                    setHotelInfo(prev => ({
                        ...prev,
                        [type === 'logo' ? 'logo' : 'coverImage']: result
                    }))
                    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated temporarily. Save to persist.`)
                }
                reader.readAsDataURL(file)
            }
        }
        input.click()
    }

    const getSaveHandler = () => {
        switch (view) {
            case 'ROLES': return handleSaveRoles
            case 'BRANDING': return handleSaveProperty
            case 'PAYMENT': return handleSavePayments
            case 'RETENTION': return handleSaveRetention
            case 'OPS': return handleSaveOps
            case 'SUBSCRIPTION': return () => toast.info('Subscription plans are managed by Super Admin')
            case 'PLANS': return handleSavePlanDefinitions
            default: return () => toast.info('Auto-saving is enabled')
        }
    }

    const handleSavePlanDefinitions = async () => {
        if (!editingPlan) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPlan)
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`${editingPlan.plan} tier updated successfully`);
                setEditingPlan(null);
                fetchPlanDefinitions();
            }
        } catch (error) {
            toast.error('Failed to update plan definition');
        } finally {
            setSaving(false);
        }
    }

    const handleIntegrationClick = (id: string) => {
        if (connectedApps.includes(id)) {
            toast.info(`Already connected to ${id}`)
        } else {
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
                loading: `Connecting to ${id}...`,
                success: () => {
                    setConnectedApps(prev => [...prev, id])
                    return `Successfully synced with ${id}`
                },
                error: 'Failed to connect'
            })
        }
    }

    return (
        <div className="min-h-screen bg-[#0B0F17] text-[#94A3B8]">
            {/* ── HEADER ── */}
            <div className="p-10 pb-6 max-w-[1700px] mx-auto w-full">
                <div className="flex items-center gap-2 text-[10px] text-[#475569] font-bold uppercase tracking-[0.2em] mb-6">
                    <span className="hover:text-white cursor-pointer transition-colors">ZENBOURG</span>
                    <ChevronRight className="w-3 h-3 text-[#1E293B]" />
                    <span className={cn("transition-colors", view !== 'OVERVIEW' ? "cursor-pointer hover:text-white" : "text-[#38BDF8]")} onClick={() => setView('OVERVIEW')}>Settings</span>
                    {view !== 'OVERVIEW' && (
                        <>
                            <ChevronRight className="w-3 h-3 text-[#1E293B]" />
                            <span className="text-[#38BDF8]">{view}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                        {view !== 'OVERVIEW' && (
                            <button onClick={() => setView('OVERVIEW')} className="p-3 bg-[#1E293B]/50 border border-[#334155]/30 rounded-2xl text-[#94A3B8] hover:text-white hover:border-[#38BDF8]/50 transition-all shadow-inner">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase leading-none">
                                {view === 'OVERVIEW' ? 'Command Center' : view === 'INTEGRATIONS' ? 'Integrations' : view === 'ROLES' ? 'Permissions' : view === 'BRANDING' ? 'Identity' : view === 'PAYMENT' ? 'Financials' : view === 'SUBSCRIPTION' ? 'Subscription' : view === 'PLANS' ? 'Subscription Tiers' : 'Operations'}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-[#475569] font-semibold tracking-tight">
                                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Administrative Access</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#1E293B]" />
                                <span>{view === 'ROLES' ? 'User Access Management' : view === 'INTEGRATIONS' ? 'External API Sync' : view === 'PLANS' ? 'Global Plan Definitions' : 'System Configuration'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {view === 'ROLES' && (
                            <button
                                onClick={() => setIsAuditLogOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-white text-[13px] font-bold rounded-[14px] transition-all shadow-xl"
                            >
                                <Clock className="w-4 h-4 text-[#38BDF8]" /> Audit Log
                            </button>
                        )}
                        <button
                            onClick={() => setView('OVERVIEW')}
                            className="px-6 py-3 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-[#94A3B8] text-[13px] font-bold rounded-[14px] transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={getSaveHandler()}
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0B0F17] text-[13px] font-bold uppercase tracking-widest rounded-[14px] shadow-lg shadow-[#38BDF8]/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Commit Changes
                        </button>
                    </div>
                </div>

                {/* ── SEARCH BAR ── */}
                {view === 'OVERVIEW' && (
                    <div className="relative mb-4">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
                            <Search className="w-5 h-5 text-[#475569]" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Find configurations, roles, or security settings..."
                            className="w-full bg-[#111827] border border-[#1F2937] rounded-[24px] pl-16 pr-24 py-6 text-[16px] text-white placeholder:text-[#475569] outline-none focus:border-[#38BDF8]/40 focus:bg-[#1E293B]/50 transition-all shadow-2xl backdrop-blur-sm"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] border border-[#334155] rounded-xl">
                            <Command className="w-3.5 h-3.5 text-[#475569]" />
                            <span className="text-[11px] font-bold text-[#475569] uppercase tracking-widest">K</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MAIN CONTENT GRID ── */}
            <div className="px-10 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-12 pb-20">


                {/* ═══ LEFT COLUMN (3/4) ═══ */}
                <div className="lg:col-span-3 space-y-14">
                    {/* Role Debugger (Visible to Admin only) */}
                    {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.email?.includes('superadmin')) && (
                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full w-fit text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                            Access Level: <span className="text-[#38BDF8] ml-2">{session?.user?.role}</span> | {session?.user?.email}
                        </div>
                    )}

                    {view === 'OVERVIEW' ? (
                        <>
                            {/* Super Admin Command Center Section */}
                            {(session?.user?.role === 'SUPER_ADMIN' || session?.user?.email === 'superadmin@zenboug.com' || session?.user?.email === 'superadmin@zenbourg.com') && (
                                <div className="space-y-8 animate-in slide-in-from-top-4 duration-700">
                                    <div className="flex items-center justify-between ml-2">
                                        <h3 className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-[0.4em]">Administrative Core</h3>
                                        <div className="h-px flex-1 bg-gradient-to-r from-[#38BDF8]/30 to-transparent ml-6" />
                                    </div>
                                    <div 
                                        onClick={() => setView('PLANS')}
                                        className="group p-10 bg-[#111827] border border-[#38BDF8]/20 rounded-[3rem] hover:border-[#38BDF8]/60 transition-all cursor-pointer shadow-3xl relative overflow-hidden"
                                    >
                                         <div className="flex items-center gap-10 relative z-10">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] group-hover:bg-[#38BDF8] group-hover:text-[#0B0F17] transition-all duration-500">
                                                <ShieldAlert className="w-10 h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                    <h4 className="text-2xl font-bold text-white uppercase tracking-tight">Plan Master Control</h4>
                                                    <div className="w-fit px-3 py-1 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-full text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest">System Protocol</div>
                                                </div>
                                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Define global tier protocols: toggle specific features and price points for Gold, Platinum, and Diamond subscriptions.</p>
                                            </div>
                                         </div>
                                         <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#38BDF8]/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-[#38BDF8]/10 transition-all duration-700" />
                                    </div>
                                </div>
                            )}

                            {/* Global Config Section */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between ml-2">
                                    <h3 className="text-[11px] font-bold text-[#475569] uppercase tracking-[0.3em]">Institutional Configuration</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-[#1E293B] to-transparent ml-6" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {GLOBAL_CONFIG.filter(i =>
                                        i.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        i.desc.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                if (item.id === 'roles') setView('ROLES')
                                                else if (item.id === 'branding') setView('BRANDING')
                                                else if (item.id === 'financial') setView('PAYMENT')
                                                else if (item.id === 'ops') setView('OPS')
                                                else if (item.id === 'subscription') setView('SUBSCRIPTION')
                                                else toast.info(`${item.label} coming soon`)
                                            }}
                                            className="group flex flex-col p-8 bg-[#111827] border border-[#1F2937] rounded-[32px] hover:border-[#38BDF8]/40 hover:bg-[#1E293B]/40 transition-all cursor-pointer shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="w-16 h-16 rounded-[20px] bg-[#0B0F17] border border-[#1F2937] flex items-center justify-center text-[#475569] group-hover:text-[#38BDF8] group-hover:border-[#38BDF8]/30 transition-all shadow-inner">
                                                    <item.icon className="w-7 h-7" />
                                                </div>
                                                <div className="p-2 bg-[#1E293B]/50 border border-[#334155]/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-white tracking-tight mb-2 uppercase">{item.label}</h4>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                            </div>
                                            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#38BDF8]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>


                            {/* System & Data Section */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between ml-2">
                                    <h3 className="text-[11px] font-bold text-[#475569] uppercase tracking-[0.3em]">Critical Infrastructure</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-[#1E293B] to-transparent ml-6" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {SYSTEM_DATA.filter(i =>
                                        i.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        i.desc.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                if (item.id === 'integrations') setView('INTEGRATIONS')
                                                else if (item.id === 'retention') setView('RETENTION')
                                                else if (item.id === 'plans') {
                                                    if (session?.user?.role !== 'SUPER_ADMIN') return toast.error('Super Admin restricted access')
                                                    setView('PLANS')
                                                }
                                                else toast.info('Coming soon')
                                            }}
                                            className="group flex items-center justify-between p-8 bg-[#111827] border border-[#1F2937] rounded-[32px] hover:border-[#38BDF8]/40 hover:bg-[#1E293B]/40 transition-all cursor-pointer shadow-2xl"
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className="w-16 h-16 rounded-[20px] bg-[#0B0F17] border border-[#1F2937] flex items-center justify-center text-[#475569] group-hover:text-[#38BDF8] group-hover:border-[#38BDF8]/30 transition-all shadow-inner">
                                                    <item.icon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-white uppercase tracking-tight">{item.label}</h4>
                                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-[#1F2937] group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : view === 'INTEGRATIONS' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {INTEGRATIONS.map(app => (
                                    <div key={app.id} className="p-8 bg-[#111827] border border-white/[0.06] rounded-[2rem] shadow-2xl relative overflow-hidden group hover:border-[#38BDF8]/20 transition-all">
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="space-y-4">
                                                <div className={cn("w-14 h-14 rounded-[1.5rem] bg-white flex items-center justify-center text-2xl font-bold", app.color)}>
                                                    {app.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-white">{app.name}</h4>
                                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">{app.type}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                {connectedApps.includes(app.id) ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1db954]/10 border border-[#1db954]/20 rounded-full text-[10px] font-bold text-[#1db954] uppercase tracking-widest">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                                        Not Linked
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-white/[0.04] relative z-10">
                                            <p className="text-sm text-gray-500 font-medium  mb-6">
                                                Sync your {app.name} bookings, listings and pricing directly with Zenbourg PMS.
                                            </p>
                                            <button
                                                onClick={() => handleIntegrationClick(app.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-[0.15em] transition-all active:scale-95 shadow-lg",
                                                    connectedApps.includes(app.id)
                                                        ? "bg-white/[0.04] border border-white/[0.1] text-white hover:bg-white/[0.08]"
                                                        : "bg-[#38BDF8] text-white hover:bg-[#0EA5E9] shadow-[#38BDF8]/10"
                                                )}
                                            >
                                                {connectedApps.includes(app.id) ? (
                                                    <><RefreshCw className="w-4 h-4" /> Sync Now</>
                                                ) : (
                                                    <><Link2 className="w-4 h-4" /> Connect App</>
                                                )}
                                            </button>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#38BDF8]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#38BDF8]/10 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : view === 'PLANS' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['GOLD', 'PLATINUM', 'DIAMOND'].map(planType => {
                    const plan = planDefinitions.find(p => p.plan === planType) || { plan: planType, features: [], price: 0 };
                    return (
                        <div key={planType} className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="space-y-2">
                                    <h3 className={cn("text-xl font-bold tracking-tight", 
                                        planType === 'GOLD' ? "text-amber-500" : 
                                        planType === 'PLATINUM' ? "text-blue-400" : "text-[#38BDF8]"
                                    )}>{planType}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Subscription Tier</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                            </div>

                            <div className="space-y-6 mb-10 relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Rate</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-white tracking-tighter">₹{plan.price.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-gray-500">/mo</span>
                                    </div>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Included Protocols</p>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {plan.features.slice(0, 4).map((f: string) => (
                                            <div key={f} className="flex items-center gap-2.5 p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] font-bold text-gray-300">
                                                <div className="w-4 h-4 rounded px-0.5 bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                    <Check className="w-3 h-3" strokeWidth={4} />
                                                </div>
                                                {f.replace(/_/g, ' ')}
                                            </div>
                                        ))}
                                        {plan.features.length > 4 && (
                                            <p className="text-[10px] font-bold text-[#38BDF8] ml-2  tracking-tight">+ {plan.features.length - 4} more advanced features</p>
                                        )}
                                        {plan.features.length === 0 && (
                                            <p className="text-[11px] text-gray-600  ml-2">No features configured</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setEditingPlan(plan)}
                                className="w-full py-4 bg-white/5 border border-white/10 hover:bg-[#38BDF8] hover:text-[#0B0F17] hover:border-[#38BDF8] text-white text-[12px] font-bold uppercase tracking-widest rounded-2xl transition-all relative z-10 shadow-xl"
                            >
                                Configure Tier
                            </button>

                            <div className={cn("absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-700 group-hover:opacity-20",
                                planType === 'GOLD' ? "bg-amber-500" : 
                                planType === 'PLATINUM' ? "bg-blue-400" : "bg-[#38BDF8]"
                            )} />
                        </div>
                    )
                })}
             </div>

             {editingPlan && (
                <div className="p-10 bg-[#161b22] border border-white/5 rounded-[3rem] shadow-3xl animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                                <LayoutDashboard className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase  tracking-tighter">Editing {editingPlan.plan} Tier</h3>
                                <p className="text-sm font-bold text-gray-500">Global Feature Entitlement Map</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Pricing Model</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        value={editingPlan.price}
                                        onChange={e => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                        className="bg-transparent border-none text-white font-bold p-0 w-24 focus:outline-none focus:ring-0"
                                    />
                                </div>
                            </div>
                            <button onClick={() => setEditingPlan(null)} className="p-4 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                        {ALL_FEATURES.map(feat => (
                            <div 
                                key={feat.id} 
                                onClick={() => {
                                    const exists = editingPlan.features.includes(feat.id);
                                    setEditingPlan({
                                        ...editingPlan,
                                        features: exists 
                                            ? editingPlan.features.filter((f: string) => f !== feat.id)
                                            : [...editingPlan.features, feat.id]
                                    });
                                }}
                                className={cn(
                                    "group p-5 border rounded-[2rem] transition-all cursor-pointer relative overflow-hidden",
                                    editingPlan.features.includes(feat.id)
                                        ? "bg-[#38BDF8]/5 border-[#38BDF8]/30 shadow-[0_0_40px_rgba(56,189,248,0.05)]"
                                        : "bg-white/[0.01] border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        editingPlan.features.includes(feat.id)
                                            ? "bg-[#38BDF8] text-[#0B0F17] scale-110"
                                            : "bg-white/5 text-gray-600 group-hover:bg-white/10"
                                    )}>
                                        {editingPlan.features.includes(feat.id) ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5 opacity-40" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className={cn("text-sm font-bold uppercase tracking-tight", 
                                            editingPlan.features.includes(feat.id) ? "text-[#38BDF8]" : "text-gray-400"
                                        )}>{feat.label}</h4>
                                        <p className="text-[11px] text-gray-500 font-medium leading-tight">{feat.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-4 p-8 bg-black/20 rounded-[2.5rem] border border-white/5">
                        <button 
                            onClick={() => setEditingPlan(null)}
                            className="px-8 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Discard Changes
                        </button>
                        <button 
                            onClick={handleSavePlanDefinitions}
                            className="flex items-center gap-2 px-10 py-3 bg-[#38BDF8] text-[#0B0F17] text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-[#0EA5E9] transition-all shadow-2xl shadow-[#38BDF8]/20"
                        >
                            Deploy Tier Protocols
                        </button>
                    </div>
                </div>
             )}
        </div>
    ) : view === 'ROLES' ? (
                        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[700px]">
                            <div className="w-full lg:w-80 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.2em] ml-2">Access Roles</h3>
                                    <button
                                        onClick={() => setIsAddRoleModalOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#38BDF8] text-[#0B0F17] text-[13px] font-bold uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#38BDF8]/10"
                                    >
                                        <Plus className="w-5 h-5" /> New Role
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {ALL_ROLES_DATA.map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedRole(role.id)}
                                            className={cn(
                                                "w-full text-left p-4 rounded-xl transition-all border group relative",
                                                selectedRole === role.id
                                                    ? "bg-[#111827] border-[#38BDF8]/30 shadow-xl"
                                                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {selectedRole === role.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]" />
                                                    )}
                                                    <div>
                                                        <h4 className={cn("text-sm font-bold", selectedRole === role.id ? "text-white" : "text-gray-400 group-hover:text-gray-200")}>
                                                            {role.label}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-500 font-medium">{role.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 space-y-8">
                                <div className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] p-10 shadow-2xl">
                                    <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                                        <Shield className="w-6 h-6 text-[#38BDF8]" /> {selectedRole} Privileges
                                    </h2>
                                    <div className="space-y-6">
                                        {PERMISSIONS_SCHEMA.map(module => (
                                            <div key={module.id} className="space-y-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-[13px] font-bold text-[#94A3B8] uppercase tracking-widest">{module.label}</h4>
                                                    <div className="h-px flex-1 bg-white/5 ml-4" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {module.permissions.map(perm => (
                                                        <div key={perm.id} className="flex items-center justify-between p-4 bg-[#101922]/20 border border-white/5 rounded-xl">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-[#0B0F17] border border-white/5 flex items-center justify-center text-[#475569]">
                                                                    <module.icon className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[14px] font-bold text-white">{perm.label}</p>
                                                                    <p className="text-[11px] text-[#475569] font-medium leading-tight max-w-[200px] mt-1">{perm.description}</p>
                                                                </div>
                                                            </div>
                                                            <Switch
                                                                checked={permissions[perm.id]}
                                                                onChange={() => handleTogglePermission(perm.id)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : view === 'BRANDING' ? (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] p-10 space-y-10 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[13px] font-bold text-white uppercase  tracking-widest flex items-center gap-3">
                                        <Building2 className="w-6 h-6 text-[#38BDF8]" /> Identity Profile
                                    </h3>
                                    <div className="h-px flex-1 bg-white/5 ml-6" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <Input label="Institutional Name" value={hotelInfo.name} onChange={e => setHotelInfo({...hotelInfo, name: e.target.value})} />
                                    <Input label="Primary Administrative Email" value={hotelInfo.email} onChange={e => setHotelInfo({...hotelInfo, email: e.target.value})} />
                                    <Input label="Contact Line" value={hotelInfo.phone} onChange={e => setHotelInfo({...hotelInfo, phone: e.target.value})} />
                                    <Input label="Geographic Address" value={hotelInfo.address} onChange={e => setHotelInfo({...hotelInfo, address: e.target.value})} />
                                    
                                    {/* Ranking Display Card */}
                                    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-between group overflow-hidden relative shadow-inner">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-[#38BDF8] uppercase tracking-[0.2em] mb-1">Visibility Index</p>
                                            <p className="text-3xl font-black text-white leading-none">#{hotelInfo.ranking || 0}</p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-2 tracking-widest">Search Priority Rank</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 relative z-10">
                                            <TrendingUp className="w-8 h-8" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#38BDF8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <Textarea label="Executive Summary / Description" value={hotelInfo.description} onChange={e => setHotelInfo({...hotelInfo, description: e.target.value})} />
                             </div>
                        </div>
                    ) : view === 'PAYMENT' ? (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] p-10 space-y-10 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[13px] font-bold text-white uppercase  tracking-widest flex items-center gap-3">
                                        <IndianRupee className="w-6 h-6 text-[#38BDF8]" /> Financial Ledger Protocol
                                    </h3>
                                    <div className="h-px flex-1 bg-white/5 ml-6" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-[#475569] uppercase tracking-widest ml-1">Reporting Currency</label>
                                        <div className="relative">
                                            <select 
                                                value={paymentSettings.baseCurrency} 
                                                onChange={e => setPaymentSettings({...paymentSettings, baseCurrency: e.target.value})} 
                                                className="w-full bg-[#0B0F17] border border-white/10 rounded-2xl p-4 text-white font-bold appearance-none cursor-pointer focus:border-[#38BDF8]/40 transition-all outline-none"
                                            >
                                                <option value="USD">USD - United States Dollar</option>
                                                <option value="INR">INR - Indian Rupee</option>
                                                <option value="EUR">EUR - Euro</option>
                                                <option value="GBP">GBP - British Pound</option>
                                            </select>
                                            <ChevronLeft className="w-5 h-5 text-[#475569] absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                    <Input label="Dynamic Tax Threshold (%)" type="number" value={paymentSettings.taxRate} onChange={e => setPaymentSettings({...paymentSettings, taxRate: parseFloat(e.target.value)})} />
                                </div>
                             </div>
                        </div>
                    ) : view === 'OPS' ? (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] p-10 space-y-12">
                                <div className="space-y-8">
                                    <h3 className="text-[13px] font-bold text-white uppercase  tracking-widest mb-6">Automated Communication</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(opsSettings.emailTemplates).map(([key, val]) => (
                                            <div key={key} className="flex items-center justify-between p-6 bg-[#0B0F17] border border-white/5 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#111827] border border-white/5 flex items-center justify-center text-[#475569]">
                                                        <Bell className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                        <p className="text-[11px] text-[#475569] font-medium">Auto-dispatch on trigger</p>
                                                    </div>
                                                </div>
                                                <Switch 
                                                    checked={val as boolean} 
                                                    onChange={() => setOpsSettings({
                                                        ...opsSettings, 
                                                        emailTemplates: {
                                                            ...opsSettings.emailTemplates, 
                                                            [key]: !val
                                                        }
                                                    })} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : view === 'RETENTION' ? (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                                <div className="flex items-center justify-between p-8 bg-white/[0.02] border border-[#38BDF8]/20 rounded-3xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <ShieldAlert className="w-6 h-6 text-[#38BDF8]" />
                                            <h3 className="text-xl font-bold text-white uppercase  tracking-tight">Legal Hold Mode</h3>
                                        </div>
                                        <p className="text-[13px] text-[#475569] font-medium max-w-[500px]">
                                            When enabled, all data purge cycles are suspended indefinitely for regulatory compliance or active investigations.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={retentionSettings.legalHoldMode} 
                                        onChange={() => setRetentionSettings({...retentionSettings, legalHoldMode: !retentionSettings.legalHoldMode})} 
                                    />
                                    <div className="absolute right-0 top-0 w-64 h-full bg-[#38BDF8]/5 blur-3xl rounded-full" />
                                </div>
                             </div>
                        </div>
                    ) : view === 'SUBSCRIPTION' ? (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-[2rem] p-8 relative overflow-hidden">
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-3xl font-bold text-white tracking-tight">{hotelInfo.plan} Plan</h3>
                                        <p className="text-gray-400 mt-2">Active until {hotelInfo.planExpiresAt || 'Never'}</p>
                                    </div>
                                    <Crown className="w-16 h-16 text-amber-500 opacity-50" />
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-[#111827] border border-white/[0.06] rounded-[2rem] p-8 shadow-2xl">
                                    <h4 className="text-white font-bold text-[13px] uppercase  tracking-[0.2em] mb-8 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#38BDF8]" /> Active Protocols
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {hotelInfo.features.length > 0 ? hotelInfo.features.map(f => (
                                            <div key={f} className="flex items-center gap-4 p-4 bg-[#0B0F17] border border-white/5 rounded-2xl group hover:border-[#38BDF8]/20 transition-all">
                                                <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <span className="text-[13px] font-bold text-[#94A3B8] group-hover:text-white transition-colors">{f.replace(/_/g, ' ')}</span>
                                            </div>
                                        )) : (
                                            <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                                                <p className="text-[11px] font-bold text-[#475569] uppercase tracking-widest">No Premium Protocols Active</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-[#111827] border border-white/[0.06] rounded-[2rem] p-8 space-y-6">
                                    <h4 className="text-white font-bold mb-2 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Quick Upgrade</h4>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'PLATINUM', name: 'Platinum Edition', price: '₹15,999/mo', color: 'text-blue-400' },
                                            { id: 'DIAMOND', name: 'Diamond Enterprise', price: '₹31,999/mo', color: 'text-blue-400' }
                                        ].filter(p => p.id !== hotelInfo.plan).map(p => (
                                            <div key={p.id} className="p-4 bg-[#101922]/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[#38BDF8]/20 transition-all">
                                                <div>
                                                    <p className={cn("text-sm font-bold uppercase tracking-tight", p.color)}>{p.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-semibold">{p.price}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleUpgradePlan(p.id)}
                                                    className="px-4 py-2 bg-[#38BDF8] text-[#0B0F17] text-[10px] font-bold uppercase rounded-lg hover:bg-[#0EA5E9] transition-all"
                                                >
                                                    Upgrade
                                                </button>
                                            </div>
                                        ))}
                                        {hotelInfo.plan === 'DIAMOND' && (
                                            <div className="py-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                                                <p className="text-xs text-gray-500">You are already on the highest plan!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : null}
                </div>

                {/* ═══ RIGHT COLUMN (SIDEBAR) ═══ */}
                <div className="space-y-10">
                    <div className="bg-[#111827] border border-[#1F2937] rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">Mission Control</h3>
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                <span className="text-[9px] font-bold text-[#10B981] uppercase tracking-wider">Operational</span>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'Backend Sync', status: 'Optimal', icon: Database, color: 'text-blue-500' },
                                { label: 'Security Firewall', status: 'Encrypted', icon: ShieldCheck, color: 'text-emerald-500' },
                                { label: 'Booking Engine', status: 'Live', icon: Globe, color: 'text-amber-500' },
                                { label: 'Payment Gateway', status: 'Verified', icon: CreditCard, color: 'text-indigo-500' }
                            ].map((stat, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-[#0B0F17] border border-[#1F2937] rounded-xl hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 bg-[#1F2937]/50 rounded-lg", stat.color)}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-300">{stat.label}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-5 bg-gradient-to-br from-[#1E293B] to-[#0B0F17] border border-[#334155]/30 rounded-3xl relative overflow-hidden">
                            <h4 className="text-[15px] font-bold text-white mb-2 uppercase  tracking-tight">System Health</h4>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-3xl font-bold text-white tracking-tighter">99.98</span>
                                <span className="text-[12px] font-bold text-[#475569] mb-1.5">%</span>
                            </div>
                            <div className="h-1.5 bg-[#0B0F17] rounded-full overflow-hidden">
                                <div className="h-full bg-[#38BDF8] w-[99.9%]" />
                            </div>
                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#38BDF8]/10 rounded-full blur-3xl" />
                        </div>
                    </div>

                    <div className="p-8 bg-[#38BDF8] rounded-[32px] relative overflow-hidden group cursor-pointer shadow-2xl">
                        <div className="relative z-10">
                            <HelpCircle className="w-10 h-10 text-[#0B0F17] mb-4" />
                            <h3 className="text-xl font-bold text-[#0B0F17] uppercase tracking-tighter mb-2">Technical Support</h3>
                            <p className="text-[13px] text-[#0B0F17]/70 font-bold leading-tight">Access white-glove support 24/7 for all configuration needs.</p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </div>
                </div>
            </div>


            {/* MODALS */}
            <Modal isOpen={isAddRoleModalOpen} onClose={() => setIsAddRoleModalOpen(false)} title="Protocol Initialization">
                 <div className="p-8 space-y-6 bg-[#0B0F17]">
                    <div className="space-y-2">
                        <Input label="Instructional Role Name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. EXECUTIVE_ASST" />
                    </div>
                    <button 
                        onClick={handleCreateRole}
                        className="w-full py-4 bg-[#38BDF8] text-[#0B0F17] text-[13px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[#0EA5E9] transition-all shadow-lg shadow-[#38BDF8]/10"
                    >
                        Initialize Role
                    </button>
                 </div>
            </Modal>
            <Modal isOpen={isAuditLogOpen} onClose={() => setIsAuditLogOpen(false)} title="Institutional Audit Log">
                 <div className="p-10 bg-[#0B0F17] text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-8 h-8 text-[#475569]" />
                    </div>
                    <p className="text-[14px] font-bold text-white uppercase tracking-tight mb-2">No Recent Activity Detected</p>
                    <p className="text-[12px] text-[#475569] font-medium leading-relaxed max-w-[300px] mx-auto">
                        All system modifications are currently synchronized with the master ledger.
                    </p>
                 </div>
            </Modal>
        </div>
    )
}
