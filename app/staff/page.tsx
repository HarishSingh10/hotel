'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Filter, LayoutGrid, Loader2, Sparkles, User, Smartphone, Package,
    Trophy, TrendingUp, Calendar, MapPin, Search, ShieldCheck, UserCheck,
    Clock, Zap, ArrowRight, CheckCircle2, ShoppingBag, ClipboardList, Settings as Tools
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

    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        if (isPunchedIn) {
            const timer = setInterval(() => setCurrentTime(new Date()), 60000)
            return () => clearInterval(timer)
        }
    }, [isPunchedIn])

    const getShiftTimes = () => {
        if (!data.attendance?.punchIn) return { start: '--:--', end: '--:--', progress: 0 }
        
        const start = new Date(data.attendance.punchIn)
        const formatTime = (d: Date) => format(d, 'HH:mm')
        
        // Progress calculation (Assuming 9-hour shift = 540 mins)
        const diffMs = currentTime.getTime() - start.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const progress = Math.min(Math.max((diffMins / 540) * 100, 0), 100)

        const estimatedEnd = new Date(start.getTime() + 9 * 60 * 60 * 1000)

        return {
            start: formatTime(start),
            end: data.attendance.punchOut ? formatTime(new Date(data.attendance.punchOut)) : formatTime(estimatedEnd),
            progress
        }
    }

    const { start, end, progress } = getShiftTimes()

    const getGreeting = () => {
        const hour = getHours(new Date())
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const perfScore = data.performanceScore?.overallScore 
        ? `${data.performanceScore.overallScore.toFixed(0)}%` 
        : (data.performanceScore?.tasksCompleted || 0) > 0 
            ? `${Math.round((data.performanceScore.tasksCompleted / (data.performanceScore.tasksCompleted + data.performanceScore.slaBreaches)) * 100)}%`
            : 'New';

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header / Greeting */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 italic opacity-80">Operational Intelligence</p>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic leading-none">
                        {getGreeting()}, <span className="text-blue-500">{data.profile?.user?.name ? data.profile.user.name.split(' ')[0] : 'Staff'}</span>
                    </h1>
                </div>
                <div 
                    onClick={() => router.push('/staff/profile')}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 p-[2px] cursor-pointer shadow-xl shadow-blue-500/10 transition-all border border-white/5"
                >
                    <div className="w-full h-full rounded-full bg-[#0d1117] flex items-center justify-center overflow-hidden border-4 border-[#161b22]">
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
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[45px] p-10 shadow-3xl relative overflow-hidden group shadow-black/60">
                {/* Advanced Background Flair */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full translate-x-32 -translate-y-32 group-hover:bg-blue-600/10 transition-colors pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", isPunchedIn ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-600")}></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Deployment Matrix</p>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase underline underline-offset-8 decoration-blue-500/20">
                                {isPunchedIn ? 'Shift In Progress' : 'Neutral Status'}
                            </h2>
                        </div>
                        <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shadow-inner group-hover:border-blue-500/30 transition-all">
                            <Clock className={cn("w-8 h-8 transition-colors", isPunchedIn ? "text-blue-500" : "text-gray-700")} />
                        </div>
                    </div>

                    {/* Dynamic Timeline Integration */}
                    {isPunchedIn && (
                        <div className="mb-10 space-y-4 animate-in slide-in-from-top duration-700">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] italic">
                                <span className="text-blue-400">P-In {start}</span>
                                <span className="text-gray-600">Sync Status: Real-time</span>
                                <span className="text-gray-400">Est. End {end}</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/[0.03] shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 blur-sm"></div>
                                </div>
                            </div>
                            <p className="text-center text-[9px] font-black text-blue-500/40 uppercase tracking-[0.5em]">System Runtime: {Math.floor(progress)}%</p>
                        </div>
                    )}

                    <button
                        onClick={handlePunch}
                        disabled={punchLoading}
                        className={cn(
                            "w-full h-20 rounded-[30px] flex items-center justify-center gap-5 font-black text-[12px] uppercase tracking-[0.3em] transition-all active:scale-[0.97] disabled:opacity-50 border shadow-2xl italic group/btn overflow-hidden relative",
                            isPunchedIn 
                                ? "bg-rose-500 text-white border-rose-400/20 hover:bg-rose-600" 
                                : "bg-blue-600 text-white border-blue-400/20 hover:bg-blue-700 shadow-blue-500/20"
                        )}
                    >
                        {punchLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Zap className={cn("w-6 h-6 z-10", isPunchedIn ? "fill-white" : "fill-white/30")} />
                                <span className="z-10">{isPunchedIn ? 'Punch Out & Logout' : 'Initiate Shift Sequence'}</span>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                            </>
                        )}
                    </button>

                    {isPunchedIn && (
                        <div className="mt-8 pt-8 border-t border-white/[0.03] animate-fade-in flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Efficiency Metrics</p>
                                    <p className="text-[11px] font-black text-white italic">Operational Performance Peak</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-800" />
                        </div>
                    )}
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

            {/* Quick Actions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">System Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => router.push('/staff/lost-found')}
                        className="p-6 bg-[#161b22] border border-white/[0.05] rounded-[30px] flex flex-col items-center gap-3 group hover:border-blue-500/30 transition-all active:scale-[0.98] shadow-xl shadow-black/20"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shadow-lg shadow-amber-500/5">
                            <Package className="w-6 h-6 text-amber-500 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Discovery Log</span>
                    </button>
                    <button 
                        onClick={() => router.push('/staff/settings')}
                        className="p-6 bg-[#161b22] border border-white/[0.05] rounded-[30px] flex flex-col items-center gap-3 group hover:border-slate-500/30 transition-all active:scale-[0.98] shadow-xl shadow-black/20"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center group-hover:bg-slate-500 group-hover:text-white transition-all shadow-lg shadow-slate-500/5">
                            <Tools className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Configuration</span>
                    </button>
                    <button 
                        onClick={() => router.push('/staff/leave')}
                        className="p-6 bg-[#161b22] border border-white/[0.05] rounded-[30px] flex flex-col items-center gap-3 group hover:border-blue-500/30 transition-all active:scale-[0.98] shadow-xl shadow-black/20"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-500/5">
                            <Calendar className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Leave Portal</span>
                    </button>
                </div>
                
                {!data.profile?.isVerified && (
                    <div 
                        onClick={() => router.push('/staff/profile')}
                        className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-amber-500/10 transition-all animate-pulse"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Identity Not Verified</p>
                                <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest leading-none mt-1">Verification protocols required for full access</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-500 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                    </div>
                )}
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
                                        <div className="bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">
                                            {format(new Date(task.createdAt), 'HH:mm')}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-black text-white tracking-tight italic mb-3 group-hover:text-blue-500 transition-colors leading-snug">{task.title}</h3>
                                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors line-clamp-2 italic mb-6">{task.description || 'Proceed with standard operational checks for this unit.'}</p>
                                    
                                    <div className="flex items-center justify-between border-t border-white/[0.05] pt-6 group/footer">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover/footer:bg-blue-600 group-hover/footer:border-blue-500 group-hover/footer:text-white transition-all">
                                                <TrendingUp className="w-4 h-4 text-blue-500 group-hover/footer:text-white transition-colors" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider italic">Ops-Route Optimized</span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-800 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
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

