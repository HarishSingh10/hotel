'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
    User, Mail, Phone, LogOut,
    FileText, Calendar, CreditCard,
    Settings, Umbrella, Info, Clock,
    ChevronRight, ShieldCheck, Briefcase, Smartphone,
    Loader2, Zap, ArrowRight, Star, Moon, BellOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
const PWAInstall = dynamic(() => import('@/components/common/PWAInstall'), { ssr: false })
import { format } from 'date-fns'

export default function StaffProfilePage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [staffData, setStaffData] = useState<any>(null)

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/me')
            if (res.ok) {
                const data = await res.json()
                setStaffData(data)
            }
        } catch (error) {
            console.error("Error fetching profile:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const handleRequestVerification = async () => {
        // Optimistic Update
        setStaffData((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, verificationRequested: true }
        }))
        
        try {
            const res = await fetch('/api/staff/verify', { method: 'POST' })
            if (res.ok) {
                toast.success("Verification request sent to owner")
                fetchProfile()
            }
        } catch (error) {
            console.error("Verification request error:", error)
        }
    }

    const handleToggleDND = async (currentStatus: boolean) => {
        // Optimistic Update
        setStaffData((prev: any) => ({
            ...prev,
            profile: { 
                ...prev.profile, 
                user: { ...prev.profile.user, dndEnabled: !currentStatus } 
            }
        }))

        try {
            const res = await fetch('/api/staff/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dndEnabled: !currentStatus })
            })
            if (!res.ok) {
               fetchProfile() // Rollback on error
            }
        } catch (error) {
            console.error("DND update error:", error)
            fetchProfile()
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing Profile Node...</p>
        </div>
    )

    const profile = staffData?.profile || {}
    const user = profile?.user || session?.user || {}

    const quickActions = [
        { label: 'Leave Requests', icon: Umbrella, href: '/staff/leave', color: 'text-amber-500', bg: 'bg-amber-600/10' },
        { label: 'Payroll Hub', icon: CreditCard, href: '/staff/payroll', color: 'text-blue-500', bg: 'bg-blue-600/10' },
        { label: 'Attendance Log', icon: Calendar, href: '/staff/attendance', color: 'text-indigo-500', bg: 'bg-indigo-600/10' },
        { label: 'Operational SOP', icon: Info, href: '/staff/sop', color: 'text-purple-500', bg: 'bg-purple-600/10' },
    ]

    return (
        <div className="space-y-8 animate-fade-in pb-16">
            {/* Header: Premium Glassmorphism & Identity */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[45px] p-8 flex flex-col items-center relative overflow-hidden group shadow-2xl shadow-black/40">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/5 blur-[60px] rounded-full -translate-x-16 translate-y-16"></div>
                
                <div className="absolute top-6 right-8 flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", profile.status === 'ACTIVE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-500")}></div>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", profile.status === 'ACTIVE' ? "text-emerald-500" : "text-gray-500")}>
                        {profile.status === 'ACTIVE' ? 'Live System' : profile.status || 'Standby'}
                    </span>
                </div>

                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 p-1 transition-all duration-300 shadow-xl shadow-blue-500/20 relative">
                        <div className="w-full h-full rounded-full bg-[#0d1117] flex items-center justify-center overflow-hidden border-4 border-[#161b22]">
                            {profile.profilePhoto ? (
                                <img
                                    src={profile.profilePhoto}
                                    alt=""
                                    className="w-full h-full object-cover transition-all duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-600/10">
                                    <User className="w-12 h-12 text-blue-500" />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#161b22] border border-white/10 rounded-full flex items-center justify-center shadow-lg">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tighter italic">{user.name || 'Staff User'}</h2>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic underline decoration-blue-500/40 decoration-2 underline-offset-8 decoration-dashed">
                        {profile.designation || 'Operational Associate'} • {profile.department || 'Operations'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-10">
                    <button 
                        onClick={() => router.push('/staff/settings')}
                        className="h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Settings className="w-4 h-4 text-gray-500" /> Settings Portal
                    </button>
                    
                    {profile.isVerified ? (
                        <div className="h-14 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Identity Verified
                        </div>
                    ) : profile.verificationRequested ? (
                        <div className="h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                             Verification Active
                        </div>
                    ) : (
                        <button 
                            onClick={handleRequestVerification}
                            className="h-14 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <User className="w-4 h-4" /> Request Verify
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Actions Grid: Corporate Aesthetic */}
            <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => router.push(action.href)}
                        className="bg-[#161b22] border border-white/[0.05] p-6 rounded-[35px] flex flex-col gap-4 text-left transition-all hover:bg-white/[0.02] active:scale-95 group shadow-lg shadow-black/20"
                    >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-inner", action.bg)}>
                            <action.icon className={cn("w-6 h-6", action.color)} />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-white italic group-hover:text-blue-500 transition-colors">{action.label}</span>
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Access Internal</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Credentials Card: Sleek List */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[40px] overflow-hidden shadow-2xl shadow-black/40">
                <div className="px-8 py-6 border-b border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">System Credentials</h3>
                    <Briefcase className="w-4 h-4 text-gray-700" />
                </div>
                <div className="p-4 space-y-2">
                    {[
                        { label: 'Staff Node', value: profile.employeeId || 'IDX-992', icon: Smartphone },
                        { label: 'Email Core', value: user.email || 'N/A', icon: Mail },
                        { label: 'Operational Since', value: profile.dateOfJoining ? format(new Date(profile.dateOfJoining), 'MMM yyyy') : 'N/A', icon: Calendar },
                    ].map((item, i) => (
                        <div key={i} className="px-6 py-5 bg-[#0d1117]/40 rounded-3xl border border-white/[0.02] flex items-center justify-between group transition-all hover:border-blue-500/20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] text-gray-600 group-hover:text-blue-500 transition-colors">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                                    <p className="text-sm font-bold text-gray-200">{item.value}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Privacy Section: DND Control */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[40px] overflow-hidden shadow-2xl shadow-black/40">
                <div className="px-8 py-6 border-b border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">Security & Privacy</h3>
                    <ShieldCheck className="w-4 h-4 text-gray-700" />
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-6 bg-[#0d1117]/40 rounded-[30px] border border-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                user.dndEnabled ? "bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10" : "bg-white/[0.03] text-gray-600"
                            )}>
                                {user.dndEnabled ? <Moon className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-0.5">Do Not Disturb</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Silence System Alerts</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleToggleDND(user.dndEnabled)}
                            className={cn(
                                "w-14 h-8 rounded-full border relative transition-all duration-500 p-1",
                                user.dndEnabled ? "bg-amber-500 border-amber-600 shadow-lg shadow-amber-500/20" : "bg-white/[0.03] border-white/10"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full bg-white transition-all duration-500 shadow-sm",
                                user.dndEnabled ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>
            </div>

            <PWAInstall />

            <button
                onClick={() => signOut({ callbackUrl: '/staff/login' })}
                className="w-full h-16 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-[25px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-rose-500/10 transition-all active:scale-[0.98] mt-4 shadow-xl shadow-rose-500/5 italic"
            >
                <LogOut className="w-4 h-4" />
                Disconnect Operational Link
            </button>
        </div>
    )
}

