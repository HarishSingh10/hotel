'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
    ChevronLeft, Bell, Smartphone, Shield, 
    Globe, Moon, Info, LogOut, ChevronRight,
    Loader2, Check, Smartphone as PhoneIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

export default function StaffSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [notifications, setNotifications] = useState({
        push: true,
        whatsapp: false,
        tasks: true
    })

    const handleToggle = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
        toast.success('Preference updated')
    }

    const handleSignOut = async () => {
        setLoading(true)
        try {
            await signOut({ callbackUrl: '/staff/login' })
        } catch {
            toast.error('Sign out failed')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 pb-20">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-4 italic">
                    <button onClick={() => router.back()} className="hover:text-white transition-colors">ZENBOURG PORTAL</button>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-blue-500">SYSTEM CONFIG</span>
                </div>

                <div className="flex items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase leading-none">Configuration</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage your operational preferences</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="px-6 space-y-8">
                {/* Notifications */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] ml-2">Communication Node</h3>
                    <div className="bg-[#161b22] border border-white/[0.05] rounded-[35px] overflow-hidden shadow-2xl">
                        {[
                            { id: 'push', label: 'Push Notifications', sub: 'Receive real-time task alerts on this device', icon: Bell },
                            { id: 'whatsapp', label: 'WhatsApp Alerts', sub: 'Get high-priority updates via WhatsApp', icon: PhoneIcon },
                            { id: 'tasks', label: 'Task Summaries', sub: 'Daily briefing of assigned objectives', icon: Shield },
                        ].map((item, idx) => (
                            <div key={item.id} className={cn("p-6 flex items-center justify-between group cursor-pointer", idx !== 2 && "border-b border-white/[0.03]")} onClick={() => handleToggle(item.id as any)}>
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white italic tracking-tight">{item.label}</h4>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-all duration-500",
                                    notifications[item.id as keyof typeof notifications] ? "bg-blue-600" : "bg-gray-800"
                                )}>
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-500",
                                        notifications[item.id as keyof typeof notifications] ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device & Security */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] ml-2">Hardware & protocols</h3>
                    <div className="bg-[#161b22] border border-white/[0.05] rounded-[35px] overflow-hidden shadow-2xl">
                         <div className="p-6 flex items-center justify-between border-b border-white/[0.03] group hover:bg-white/[0.01] transition-all cursor-pointer">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white italic tracking-tight">Active Device</h4>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Primary Operation Unit: Mobile</p>
                                </div>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">Encrypted</span>
                        </div>
                        <div className="p-6 flex items-center justify-between group hover:bg-white/[0.01] transition-all cursor-pointer">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white italic tracking-tight">Sync Region</h4>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Auto-detection: Local Grid</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="pt-4 space-y-4">
                    <button 
                        onClick={handleSignOut}
                        disabled={loading}
                        className="w-full p-6 bg-rose-500/5 border border-rose-500/20 rounded-[30px] flex items-center justify-center gap-4 group hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-rose-500/5"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogOut className="w-6 h-6 text-rose-500 group-hover:text-white" />}
                        <span className="text-[12px] font-black uppercase tracking-[0.2em] group-hover:text-white">Terminate Session</span>
                    </button>
                    <p className="text-[9px] text-center text-gray-700 font-bold uppercase tracking-[0.3em]">Zenbourg OS v2.4.1 (Stable)</p>
                </div>
            </div>
        </div>
    )
}
