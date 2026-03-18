'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Clock, CheckCircle2, AlertCircle,
    ArrowRight, Bell, Zap,
    ClipboardList, ShoppingBag,
    Filter, LayoutGrid, Loader2, Sparkles, User, Smartphone
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import PWAInstall from '@/components/common/PWAInstall'

export default function StaffDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [punchLoading, setPunchLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'TASKS' | 'ORDERS'>('TASKS')

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/me')
            if (res.status === 401) {
                router.push('/staff/login')
                return
            }
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handlePunch = async () => {
        setPunchLoading(true)
        try {
            const res = await fetch('/api/staff/attendance', { method: 'POST' })
            if (res.ok) {
                const json = await res.json()
                toast.success(json.message)
                fetchData()
            } else {
                toast.error('Failed to update attendance')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setPunchLoading(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )
    if (!data) return <div className="p-8 text-center text-rose-500 font-bold">Error loading profile</div>

    const isPunchedIn = data.attendance?.punchIn && !data.attendance?.punchOut
    const isPunchedOutToday = !!data.attendance?.punchOut

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Online & Ready</span>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Hi, {data.profile?.user?.name ? data.profile.user.name.split(' ')[0] : 'Staff'}</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{data.profile?.department}</p>
                    <button
                        onClick={() => {
                            const event = new CustomEvent('pwa-install-manual');
                            window.dispatchEvent(event);
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-600/20 transition-all flex items-center gap-1.5 w-fit"
                    >
                        <Smartphone className="w-3 h-3" /> Install App
                    </button>
                </div>
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[#1d2b3a] border border-white/10 flex items-center justify-center overflow-hidden">
                        {data.profile?.profilePhoto ? (
                            <img src={data.profile.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6 text-gray-500" />
                        )}
                    </div>
                </div>
            </div>

            <PWAInstall />

            {/* Shift Card */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-blue-600/10 transition-all duration-700"></div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Today&apos;s Shift</p>
                        <p className="text-sm font-black text-white">09:00 AM - 05:00 PM</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Time</p>
                        <p className="text-xl font-black text-white tracking-tighter italic">{format(new Date(), 'HH:mm')}</p>
                    </div>
                </div>

                {!isPunchedOutToday ? (
                    <button
                        onClick={handlePunch}
                        disabled={punchLoading}
                        className={cn(
                            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 relative z-10",
                            isPunchedIn
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        )}
                    >
                        {punchLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Zap className={cn("w-5 h-5", isPunchedIn ? "fill-white" : "fill-white/20")} />
                                <span>{isPunchedIn ? 'Punch Out' : 'Punch In'}</span>
                            </>
                        )}
                    </button>
                ) : (
                    <div className="w-full h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-3 relative z-10">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Shift Completed</span>
                    </div>
                )}

                {!isPunchedOutToday && (
                    <p className="mt-6 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest relative z-10">
                        {isPunchedIn ? 'You are currently on duty' : 'You are on time. Have a great shift!'}
                    </p>
                )}
            </div>

            {/* Alert Banner (Real-time mapping) */}
            {data.systemAlerts && data.systemAlerts.length > 0 ? (
                <div 
                    onClick={() => router.push('/staff/notifications')}
                    className={cn(
                        "rounded-2xl p-5 flex items-start gap-4 relative overflow-hidden group cursor-pointer transition-all",
                        data.systemAlerts[0].type === 'CRITICAL' 
                            ? "bg-rose-500/5 border border-rose-500/20" 
                            : "bg-orange-500/5 border border-orange-500/20"
                    )}
                >
                    <div className={cn(
                        "absolute inset-y-0 left-0 w-1",
                        data.systemAlerts[0].type === 'CRITICAL' ? "bg-rose-500" : "bg-orange-500"
                    )}></div>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        data.systemAlerts[0].type === 'CRITICAL' ? "bg-rose-500/20" : "bg-orange-500/20"
                    )}>
                        <AlertCircle className={cn("w-5 h-5", data.systemAlerts[0].type === 'CRITICAL' ? "text-rose-500" : "text-orange-500")} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-black text-white leading-none mb-1.5 flex items-center gap-2">
                            {data.systemAlerts[0].message} 
                            {data.systemAlerts[0].type === 'CRITICAL' && <Sparkles className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
                        </h3>
                        <p className="text-xs text-text-tertiary font-medium leading-relaxed">{data.systemAlerts[0].description || 'Priority attention required across all departments.'}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            View All Alerts <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white leading-none mb-1">System Status Normal</h3>
                        <p className="text-[10px] text-blue-200/40 font-bold uppercase tracking-widest">No critical alerts for your property</p>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'Completed', value: '4', icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Pending', value: data.tasks.length.toString(), icon: ClipboardList, color: 'text-blue-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#161b22] border border-white/[0.05] p-5 rounded-2xl flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* My Queue */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white tracking-tight italic">My Queue</h3>
                    <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
                        <button
                            onClick={() => setActiveTab('TASKS')}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'TASKS' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('ORDERS')}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'ORDERS' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            Orders
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {activeTab === 'TASKS' ? (
                        data.tasks.slice(0, 5).map((task: any) => (
                            <div
                                key={task.id}
                                className="bg-[#161b22] p-4 rounded-3xl border border-white/[0.05] flex flex-col gap-4 group cursor-pointer hover:bg-white/[0.02] transition-colors relative"
                            >
                                <div className={cn(
                                    "absolute top-0 bottom-0 left-0 w-1 rounded-l-full",
                                    task.priority === 'URGENT' ? 'bg-rose-500' : 'bg-blue-500'
                                )}></div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-black text-white leading-tight">Room {task.room?.roomNumber || 'N/A'}</h4>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em]",
                                            task.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
                                        )}>
                                            {task.priority || 'NORMAL'}
                                        </span>
                                    </div>
                                    <p className="text-[13px] font-bold text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-1">{task.title}</p>
                                    <p className="text-[11px] text-gray-600 mt-1 font-medium">{task.room?.roomNumber ? `Guest departed 10m ago` : 'Assigned just now'}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.push(`/staff/tasks/${task.id}`)}
                                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" /> View Directives
                                    </button>
                                    <button className="w-12 h-12 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all">
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center bg-[#161b22] rounded-3xl border border-dashed border-white/10">
                            <ShoppingBag className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-600">No active food orders</p>
                        </div>
                    )}

                    {activeTab === 'TASKS' && data.tasks.length === 0 && (
                        <div className="py-12 text-center bg-[#161b22] rounded-3xl border border-dashed border-white/10">
                            <ClipboardList className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-600">All caught up!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

