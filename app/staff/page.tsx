'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Clock, CheckCircle2, AlertCircle,
    ArrowRight, Bell, Zap,
    ClipboardList, ShoppingBag,
    Filter, LayoutGrid, Loader2, Sparkles, User, Smartphone,
    Trophy, TrendingUp, Calendar, MapPin
} from 'lucide-react'
import { format, getHours } from 'date-fns'
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

    const getGreeting = () => {
        const hour = getHours(new Date())
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    // Mock shift progress for visual excellence
    const shiftProgress = isPunchedIn ? 45 : 0 // 45% through shift

    const perfScore = data.performanceScore?.overallScore 
        ? `${data.performanceScore.overallScore.toFixed(0)}%` 
        : (data.performanceScore?.tasksCompleted || 0) > 0 
            ? `${Math.round((data.performanceScore.tasksCompleted / (data.performanceScore.tasksCompleted + data.performanceScore.slaBreaches)) * 100)}%`
            : 'New';

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header / Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight italic">
                        {getGreeting()}, <span className="text-blue-500">{data.profile?.user?.name ? data.profile.user.name.split(' ')[0] : 'Staff'}</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded-lg w-fit">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{data.profile?.department || 'Operations'} • Phase II</span>
                    </div>
                </div>
                <div 
                    onClick={() => router.push('/staff/profile')}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-[1px] cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="w-full h-full rounded-[15px] bg-[#0d1117] flex items-center justify-center overflow-hidden">
                        <img 
                            src={data.profile?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.profile?.user?.name || 'staff'}`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                </div>
            </div>

            <PWAInstall />

            {/* Shift Information Card */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full translate-x-32 -translate-y-32"></div>
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Current Session</p>
                            <h2 className="text-xl font-black text-white tracking-tight italic">
                                {isPunchedIn ? 'Shift in Progress' : 'Ready for Duty'}
                            </h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>

                    {/* Progress Bar (Only visible if punched in) */}
                    {isPunchedIn && (
                        <div className="space-y-2 mb-8 animate-fade-in-up">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <span>Shift Start</span>
                                <span className="text-blue-500">Log time correctly</span>
                                <span>Shift End</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                    style={{ width: `${shiftProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handlePunch}
                        disabled={punchLoading}
                        className={cn(
                            "w-full h-16 rounded-2xl flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 border",
                            isPunchedIn 
                                ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20 border-rose-400/20" 
                                : "bg-blue-600 text-white shadow-xl shadow-blue-500/20 border-blue-400/20"
                        )}
                    >
                        {punchLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Zap className={cn("w-5 h-5", isPunchedIn ? "fill-white" : "fill-white/30")} />
                                <span>{isPunchedIn ? 'Punch Out & Logout' : 'Punch In to Start'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'Assigned', value: data.tasks.length, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-600/10' },
                    { label: 'Performance', value: perfScore, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-600/10' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#161b22] border border-white/[0.05] p-5 rounded-3xl group hover:border-white/10 transition-all flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{kpi.label}</p>
                            <p className="text-2xl font-black text-white italic">{kpi.value}</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border border-white/[0.05]", kpi.bg)}>
                            <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                        </div>
                    </div>
                ))}
            </div>

            {/* My Active Queue */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-white tracking-tight italic flex items-center gap-2">
                        Execution Queue <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </h3>
                    <div className="flex bg-[#161b22] p-1 rounded-xl border border-white/[0.05] shadow-inner shadow-black/40">
                        {['TASKS', 'ORDERS'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {activeTab === 'TASKS' ? (
                        data.tasks.length === 0 ? (
                            <div className="py-24 text-center bg-[#161b22] rounded-[40px] border border-dashed border-white/5 space-y-4">
                                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-700 italic">Clear skies! All tasks complete.</p>
                            </div>
                        ) : (
                            data.tasks.slice(0, 5).map((task: any) => (
                                <div
                                    key={task.id}
                                    onClick={() => router.push(`/staff/tasks/${task.id}`)}
                                    className="bg-[#161b22] p-6 rounded-[35px] border border-white/[0.05] group cursor-pointer hover:bg-white/[0.02] transition-all relative overflow-hidden group active:scale-[0.98]"
                                >
                                    <div className={cn(
                                        "absolute top-0 bottom-0 left-0 w-1.5 transition-all group-hover:w-2",
                                        task.priority === 'URGENT' ? 'bg-rose-500' : 'bg-blue-600'
                                    )}></div>

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                                                <LayoutGrid className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white italic tracking-tight">Room {task.room?.roomNumber || 'Gen-Ops'}</h4>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest",
                                                    task.priority === 'URGENT' ? 'text-rose-500' : 'text-blue-500'
                                                )}>
                                                    Priority: {task.priority || 'Standard'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                            {format(new Date(task.createdAt), 'HH:mm')}
                                        </div>
                                    </div>
                                    
                                    <p className="text-[14px] font-bold text-gray-300 group-hover:text-white transition-colors mb-4 italic leading-snug">{task.title}</p>
                                    
                                    <div className="flex items-center justify-between border-t border-white/[0.03] pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                                <TrendingUp className="w-3 h-3 text-blue-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider italic">Assigned via Auto-Routing</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-700 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        <div className="py-24 text-center bg-[#161b22] rounded-[40px] border border-dashed border-white/5 space-y-4">
                            <ShoppingBag className="w-10 h-10 text-gray-800 mx-auto opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-700 italic">No food/beverage orders pending.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PWA Awareness Feature */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[40px] flex items-center justify-between relative overflow-hidden group cursor-pointer shadow-2xl shadow-blue-600/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white italic tracking-tight italic">Operations Offline?</h4>
                        <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest">Install App for native experience</p>
                    </div>
                </div>
                <button className="relative z-10 w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

