'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
    Copy, Edit3, ClipboardList, Check, Sparkles, Gem, Crown, TrendingUp,
    Zap, Cpu, Activity
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

const ALL_ROLES_DATA = [
    { id: 'SUPER_ADMIN', label: 'Hotel Owner', desc: 'System Admin Access', badge: 'Active' },
    { id: 'HOTEL_ADMIN', label: 'General Manager', desc: 'Manage operations', badge: 'Active' },
    { id: 'MANAGER', label: 'Front Desk Agent', desc: 'Guest services focus', badge: 'Active' },
    { id: 'RECEPTIONIST', label: 'Housekeeping Staff', desc: 'Room updates only', badge: 'Active' },
    { id: 'STAFF', label: 'Maintenance', desc: 'Work orders', badge: 'Active' },
]

export default function SettingsOverviewPage() {
    const { data: session } = useSession()
    const [view, setView] = useState<'OVERVIEW' | 'INTEGRATIONS' | 'ROLES' | 'BRANDING' | 'PAYMENT' | 'RETENTION' | 'OPS' | 'SUBSCRIPTION' | 'PLANS'>('OVERVIEW')
    const [planDefinitions, setPlanDefinitions] = useState<any[]>([])
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [connectedApps, setConnectedApps] = useState<string[]>([])

    // State Objects
    const [hotelInfo, setHotelInfo] = useState({
        name: '', description: '', address: '', phone: '', email: '', logo: '', coverImage: '', plan: 'GOLD', features: [] as string[], planExpiresAt: null as string | null, ranking: 0
    })

    const [paymentSettings, setPaymentSettings] = useState({
        baseCurrency: 'INR', taxRate: 18.0, allowPartial: true, invoiceAutoGenerate: true,
        gateways: [{ id: 'stripe', status: 'NOT_CONNECTED' }, { id: 'razorpay', status: 'CONNECTED' }],
        acceptedMethods: { creditCard: true, cash: true, wireTransfer: false, crypto: false }
    })

    const [retentionSettings, setRetentionSettings] = useState({
        legalHoldMode: false, guestProfiles: '3_YEARS', scans: '30_DAYS', financials: '7_YEARS', serviceLogs: '1_YEAR'
    })

    const [opsSettings, setOpsSettings] = useState({
        emailTemplates: { welcome: true, checkout: true, reminder: false },
        notifications: { smsAlerts: false, pushNotifications: true, slackLogs: false },
        housekeeping: { autoSchedule: true, dailyChange: false, inspectionRequired: true }
    })

    const [selectedRole, setSelectedRole] = useState('MANAGER')
    const [permissions, setPermissions] = useState<Record<string, any>>({})
    const [rolePermissions, setRolePermissions] = useState<any[]>([])
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false)
    const [newRoleName, setNewRoleName] = useState('')
    const [isAuditLogOpen, setIsAuditLogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Helpers
    const currentPropertyId = useMemo(() => {
        return session?.user?.role === 'SUPER_ADMIN'
            ? getAdminContext()?.propertyId
            : session?.user?.propertyId
    }, [session])

    const fetchPropertyInfo = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        try {
            const res = await fetch(buildContextUrl(`/api/admin/settings/property?propertyId=${currentPropertyId}`))
            const data = await res.json()
            if (data.success) setHotelInfo(data.property)
        } catch (e) { console.error(e) }
    }, [currentPropertyId])

    const fetchRoles = useCallback(async () => {
        if (!currentPropertyId || currentPropertyId === 'ALL') return
        try {
            const res = await fetch(buildContextUrl('/api/admin/settings/roles'))
            const data = await res.json()
            if (data.success) {
                setRolePermissions(data.rolePermissions || [])
                const current = data.rolePermissions.find((rp: any) => rp.role === selectedRole)
                if (current) setPermissions(current.permissions || {})
            }
        } catch (e) { console.error(e) }
    }, [currentPropertyId, selectedRole])

    useEffect(() => {
        setLoading(true)
        Promise.all([fetchPropertyInfo(), fetchRoles()]).finally(() => setLoading(false))
    }, [currentPropertyId]) // Fetch all on property change

    useEffect(() => {
        // Only fetch roles when role selection changes, to save resources
        fetchRoles()
    }, [selectedRole, fetchRoles])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Logic for different views
            let url = '/api/admin/settings/property'
            let body: any = { propertyId: currentPropertyId, ...hotelInfo }

            if (view === 'ROLES') {
                url = '/api/admin/settings/roles'
                body = { propertyId: currentPropertyId, role: selectedRole, permissions }
            } else if (view === 'PAYMENT') {
                url = '/api/admin/settings/payments'
                body = { propertyId: currentPropertyId, paymentSettings }
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success('System Configuration Synchronized', {
                    description: `Parameters for ${view} updated successfully.`
                })
            }
        } catch (e) {
            toast.error('Encryption Failure', { description: 'Failed to commit changes to the ledger.' })
        } finally {
            setSaving(false)
        }
    }

    const handleTogglePermission = (id: string) => {
        setPermissions(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const filteredConfig = GLOBAL_CONFIG.filter(i => 
        i.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.desc.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#06080C] text-slate-400 font-sans selection:bg-blue-500/30">
            {/* ── DYNAMIC BACKGROUND ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            {/* ── HEADER ── */}
            <div className="relative sticky top-0 z-30 bg-[#06080C]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {view !== 'OVERVIEW' && (
                            <button 
                                onClick={() => setView('OVERVIEW')}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Command Terminal</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{view}</span>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
                                {view === 'OVERVIEW' ? 'System Settings' : view}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving || view === 'OVERVIEW'}
                            className={cn(
                                "h-12 px-8 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50",
                                view === 'OVERVIEW' ? "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed" : "bg-blue-600 text-white shadow-xl shadow-blue-600/10 hover:bg-blue-500"
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span className="hidden sm:inline">Synchronize Ledger</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTAINER ── */}
            <div className="relative max-w-[1600px] mx-auto px-4 md:px-10 py-6 md:py-16">
                
                {/* ── BREADCRUMBS & OVERVIEW SEARCH ── */}
                {view === 'OVERVIEW' && (
                    <div className="mb-8 md:mb-16 space-y-6 md:space-y-10">
                        <div className="relative group w-full">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[20px] md:rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative">
                                <Search className="absolute left-5 md:left-7 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search protocols..."
                                    className="w-full bg-[#0B0F17] border border-white/5 rounded-[20px] md:rounded-[28px] pl-14 md:pl-16 pr-6 md:pr-10 py-5 md:py-7 text-sm md:text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-all shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {[
                                { label: 'Uptime', value: '99.98%', icon: Activity, color: 'text-emerald-500' },
                                { label: 'Latency', value: '42ms', icon: Zap, color: 'text-blue-500' },
                                { label: 'Security', value: 'AES-256', icon: ShieldCheck, color: 'text-indigo-500' },
                                { label: 'Sync', value: 'Ready', icon: RefreshCw, color: 'text-amber-500' },
                            ].map((s, i) => (
                                <div key={i} className="p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                        <div className={cn("p-1.5 rounded-lg bg-black/40", s.color)}>
                                            <s.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </div>
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</span>
                                    </div>
                                    <div className="text-lg md:text-2xl font-black text-white italic tracking-tighter">{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── VIEWS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                    
                    {/* LEFT CONTENT (8/12) */}
                    <div className="order-2 lg:order-1 lg:col-span-8 flex flex-col gap-6 md:gap-10">
                        {view === 'OVERVIEW' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {filteredConfig.map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => {
                                            if (item.id === 'branding') setView('BRANDING')
                                            else if (item.id === 'roles') setView('ROLES')
                                            else if (item.id === 'financial') setView('PAYMENT')
                                            else if (item.id === 'ops') setView('OPS')
                                            else if (item.id === 'subscription') setView('SUBSCRIPTION')
                                        }}
                                        className="group p-8 bg-[#0B0F17] border border-white/5 rounded-[32px] text-left hover:bg-white/[0.04] hover:border-blue-500/20 transition-all shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between mb-10">
                                            <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all shadow-inner">
                                                <item.icon className="w-8 h-8" />
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <ChevronRight className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">{item.label}</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}

                                {/* Infrastructure Section Header */}
                                <div className="col-span-full mt-10 mb-2">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Core Infrastructure</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                </div>

                                {SYSTEM_DATA.map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => {
                                            if (item.id === 'retention') setView('RETENTION')
                                            else if (item.id === 'integrations') setView('INTEGRATIONS')
                                        }}
                                        className="group p-6 bg-[#0B0F17] border border-white/5 rounded-[24px] text-left hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center gap-6"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-black border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-400 transition-all shrink-0">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase italic tracking-widest">{item.label}</h4>
                                            <p className="text-[11px] text-slate-500 font-bold mt-0.5">{item.desc}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-800 ml-auto group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                    </button>
                                ))}
                            </div>
                        ) : view === 'ROLES' ? (
                            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-3xl">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                                <Shield className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{selectedRole} Matrix</h2>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Permission Level Protocol</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setIsAddRoleModalOpen(true)}
                                                className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-white transition-all"
                                            >
                                                Initialize New Role
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-12">
                                        {PERMISSIONS_SCHEMA.map(module => (
                                            <div key={module.id} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <h4 className="text-[11px] font-black text-blue-500/60 uppercase tracking-[0.4em] italic">{module.label} Core</h4>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(module.permissions || []).map(perm => (
                                                        <div key={perm.id} className="group p-5 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-between hover:border-white/10 transition-all">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors shrink-0">
                                                                    <module.icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-sm font-black text-white uppercase italic tracking-tight">{perm.label}</p>
                                                                    <p className="text-[11px] text-slate-600 font-bold leading-tight">{perm.description}</p>
                                                                </div>
                                                            </div>
                                                            <Switch 
                                                                checked={!!(permissions || {})[perm.id]} 
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
                        ) : view === 'BRANDING' ? (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-3xl space-y-12">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                                <Building2 className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Identity Profile</h2>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Institutional Branding Protocols</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Institutional Name</label>
                                            <input 
                                                value={hotelInfo.name} 
                                                onChange={e => setHotelInfo({...hotelInfo, name: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800"
                                                placeholder="e.g. Zenbourg Grand Palace"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Administrative Email</label>
                                            <input 
                                                type="email"
                                                value={hotelInfo.email} 
                                                onChange={e => setHotelInfo({...hotelInfo, email: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800"
                                                placeholder="admin@zenbourg.com"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Handshake</label>
                                            <input 
                                                value={hotelInfo.phone} 
                                                onChange={e => setHotelInfo({...hotelInfo, phone: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800"
                                                placeholder="+91 0000 0000 00"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Geographic Coordinates</label>
                                            <input 
                                                value={hotelInfo.address} 
                                                onChange={e => setHotelInfo({...hotelInfo, address: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800"
                                                placeholder="Street, City, HQ"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Executive Summary</label>
                                        <textarea 
                                            rows={4}
                                            value={hotelInfo.description} 
                                            onChange={e => setHotelInfo({...hotelInfo, description: e.target.value})}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-white font-bold focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800 resize-none"
                                            placeholder="Brief institutional overview..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : view === 'PAYMENT' ? (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-3xl space-y-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <IndianRupee className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Financial Ledger</h2>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ledger Distribution & Tax Rules</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Global Currency Unit</label>
                                            <div className="relative">
                                                <select 
                                                    value={paymentSettings.baseCurrency} 
                                                    onChange={e => setPaymentSettings({...paymentSettings, baseCurrency: e.target.value})} 
                                                    className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-black appearance-none cursor-pointer focus:border-blue-500/40 transition-all outline-none"
                                                >
                                                    <option value="INR">INR - Indian Rupee (Primary)</option>
                                                    <option value="USD">USD - United States Dollar</option>
                                                    <option value="EUR">EUR - Euro Matrix</option>
                                                    <option value="GBP">GBP - British Pound</option>
                                                </select>
                                                <ChevronLeft className="w-5 h-5 text-slate-700 absolute right-5 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Universal Tax Threshold (%)</label>
                                            <input 
                                                type="number" 
                                                value={paymentSettings.taxRate} 
                                                onChange={e => setPaymentSettings({...paymentSettings, taxRate: parseFloat(e.target.value)})}
                                                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white font-black focus:border-blue-500/40 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Active Gateways</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(paymentSettings.gateways || []).map(gw => (
                                                <div key={gw.id} className="p-6 bg-black/40 border border-white/5 rounded-[28px] flex items-center justify-between group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                                                            <CreditCard className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase italic tracking-tight">{gw.id}</p>
                                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{gw.status === 'CONNECTED' ? 'Live Link Active' : 'Not Configured'}</p>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full",
                                                        gw.status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-slate-800'
                                                    )} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'OPS' ? (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-3xl space-y-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                            <Smartphone className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Operational Protocols</h2>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Notification & Automation Matrix</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Alert Distribution</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { id: 'smsAlerts', label: 'SMS Gateway Enabled', icon: Bell },
                                                    { id: 'pushNotifications', label: 'Push Protocol Enabled', icon: Zap },
                                                    { id: 'slackLogs', label: 'Slack Webhook Sync', icon: Database },
                                                ].map(n => (
                                                    <div key={n.id} className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors">
                                                                <n.icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-sm font-black text-white uppercase italic tracking-tight">{n.label}</span>
                                                        </div>
                                                        <Switch 
                                                            checked={!!(opsSettings.notifications as any)[n.id]} 
                                                            onChange={() => setOpsSettings({
                                                                ...opsSettings, 
                                                                notifications: { ...opsSettings.notifications, [n.id]: !(opsSettings.notifications as any)[n.id] }
                                                            })} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'SUBSCRIPTION' ? (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-3xl space-y-12">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                                <Sparkles className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Plan Ecosystem</h2>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Current License & Feature Access</p>
                                            </div>
                                        </div>
                                        <Badge variant="blue" className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] italic">{hotelInfo.plan || 'No Plan'}</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="p-8 bg-black/40 border border-white/5 rounded-[32px] space-y-4">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Renewal Date</p>
                                            <div className="flex items-center gap-4">
                                                <Calendar className="w-8 h-8 text-blue-500" />
                                                <span className="text-2xl font-black text-white italic tracking-tighter uppercase">{hotelInfo.planExpiresAt || 'Perpetual'}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-black/40 border border-white/5 rounded-[32px] space-y-4">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol Version</p>
                                            <div className="flex items-center gap-4">
                                                <Cpu className="w-8 h-8 text-emerald-500" />
                                                <span className="text-2xl font-black text-white italic tracking-tighter uppercase">Zenbourg v2.4</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Active Feature Modules</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {(hotelInfo.features || []).length > 0 ? (hotelInfo.features || []).map(f => (
                                                <div key={f} className="flex items-center gap-4 p-4 bg-[#0B0F17] border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[13px] font-bold text-slate-400 group-hover:text-white transition-colors">{f.replace(/_/g, ' ')}</span>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                                                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">No Premium Protocols Active</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                    </div>

                    {/* RIGHT SIDEBAR (4/12) */}
                    <div className="order-1 lg:order-2 lg:col-span-4 flex flex-col gap-6 md:gap-8">
                        {/* ROLES SELECTOR SIDEBAR */}
                        {view === 'ROLES' ? (
                            <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] p-8 shadow-3xl">
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Access Hierarchy</h3>
                                <div className="space-y-3">
                                    {ALL_ROLES_DATA.map(role => (
                                        <button 
                                            key={role.id}
                                            onClick={() => setSelectedRole(role.id)}
                                            className={cn(
                                                "w-full text-left p-6 rounded-[24px] border transition-all flex items-center justify-between group",
                                                selectedRole === role.id 
                                                    ? "bg-blue-600/10 border-blue-500/30 text-white" 
                                                    : "bg-black border-transparent text-slate-500 hover:bg-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full transition-all",
                                                    selectedRole === role.id ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-slate-800"
                                                )} />
                                                <div>
                                                    <p className={cn("text-sm font-black uppercase italic tracking-tight", selectedRole === role.id ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>{role.label}</p>
                                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{role.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className={cn("w-4 h-4 transition-all opacity-0 group-hover:opacity-100", selectedRole === role.id && "opacity-100 translate-x-1")} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Global Visibility Card */}
                                <div className="bg-[#0B0F17] border border-white/5 rounded-[40px] overflow-hidden shadow-3xl group">
                                    <div className="p-8 pb-4">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Global Live</span>
                                            </div>
                                            <Cpu className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">Visibility Index</h3>
                                        <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">Search priority and operational SEO ranking based on protocol adherence.</p>
                                    </div>
                                    <div className="p-8 pt-4 flex items-end gap-3">
                                        <span className="text-5xl font-black text-white italic tracking-tighter">#{hotelInfo.ranking || 0}</span>
                                        <div className="mb-2 p-1.5 bg-blue-600/10 text-blue-500 rounded-lg">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="px-8 pb-8">
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 w-[78%]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Support Hub */}
                                <div className="bg-blue-600 rounded-[40px] p-10 relative overflow-hidden group cursor-pointer shadow-3xl">
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                            <HelpCircle className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">Protocol Support</h3>
                                        <p className="text-sm font-bold text-white/70 leading-relaxed uppercase tracking-widest text-[11px]">Direct 24/7 access to Zenbourg Technical Command for configuration assistance.</p>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* ── MODALS ── */}
            <Modal 
                isOpen={isAddRoleModalOpen} 
                onClose={() => setIsAddRoleModalOpen(false)} 
                title="System Protocol: Role Initialization"
                size="md"
            >
                <div className="p-10 space-y-10 bg-[#06080c]">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">New Role Identifier</label>
                        <input 
                            value={newRoleName} 
                            onChange={e => setNewRoleName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-black italic focus:border-blue-500/40 outline-none transition-all placeholder:text-slate-800"
                            placeholder="e.g. EXECUTIVE_ASST"
                        />
                    </div>
                    <button 
                        className="w-full h-16 rounded-[24px] bg-blue-600 text-white font-black text-[13px] uppercase tracking-[0.3em] italic shadow-2xl shadow-blue-600/20 active:scale-95 transition-all hover:bg-blue-500"
                    >
                        Initialize Identity Matrix
                    </button>
                </div>
            </Modal>
        </div>
    )
}
