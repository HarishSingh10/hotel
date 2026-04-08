'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock,
    MapPin, ArrowUpRight, ArrowDownRight,
    Search, Filter, Loader2, Sparkles, User,
    CalendarDays, ShieldCheck, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from 'date-fns'

export default function AttendancePage() {
    const router = useRouter()
    const [view, setView] = useState<'HISTORY' | 'ROSTER'>('HISTORY')
    const [loading, setLoading] = useState(true)
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [staffInfo, setStaffInfo] = useState<any>(null)
    const [currentMonth] = useState(new Date())

    const fetchData = useCallback(async () => {
        try {
            const [attRes, meRes] = await Promise.all([
                fetch('/api/staff/attendance'),
                fetch('/api/staff/me')
            ])
            
            if (attRes.ok) {
                const data = await attRes.json()
                setAttendanceData(data)
            }
            if (meRes.ok) {
                const data = await meRes.json()
                setStaffInfo(data.profile)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const monthName = format(currentMonth, 'MMMM yyyy')

    const stats = [
        { label: 'Present', value: attendanceData.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Late Log', value: attendanceData.filter(a => a.status === 'LATE').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Absence', value: attendanceData.filter(a => a.status === 'ABSENT').length, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ]

    const roster = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(new Date(), i)
        const isOff = date.getDay() === 0 
        const shiftStr = staffInfo?.workShift || 'Morning Session'
        
        return {
            date: format(date, 'EEE, MMM dd'),
            shift: isOff ? 'OFF' : (shiftStr.split(' ')[0] || 'Scheduled'),
            time: isOff ? 'UNASSIGNED' : '09:00 - 17:00 OPS',
            dep: staffInfo?.department || 'Operations'
        }
    })

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    return (
        <div className="space-y-10 animate-fade-in pb-16">
            {/* Header: Premium Centered Identity */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center px-4">
                    <h1 className="text-xl font-black text-white tracking-tight italic">Attendance Vault</h1>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5 italic">{monthName} Operational Log</p>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-[#161b22] border border-white/[0.05] p-5 rounded-[30px] text-center shadow-2xl shadow-black/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-white/[0.02] rounded-full translate-x-4 -translate-y-4"></div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/[0.05] shadow-inner", s.bg)}>
                            <s.icon className={cn("w-5 h-5", s.color)} />
                        </div>
                        <p className="text-2xl font-black text-white italic tracking-tighter">{s.value}</p>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 mt-2 font-mono">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* View Switcher: High-End Slider */}
            <div className="bg-[#161b22] p-1.5 rounded-[25px] border border-white/[0.05] flex shadow-inner shadow-black/40">
                <button
                    onClick={() => setView('HISTORY')}
                    className={cn(
                        "flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95",
                        view === 'HISTORY' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <Clock className="w-4 h-4" /> Operational History
                </button>
                <button
                    onClick={() => setView('ROSTER')}
                    className={cn(
                        "flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95",
                        view === 'ROSTER' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <CalendarDays className="w-4 h-4" /> Future Roster
                </button>
            </div>

            {/* Dynamic Content List */}
            <div className="space-y-6">
                {view === 'HISTORY' ? (
                    <div className="space-y-4">
                        {attendanceData.length === 0 ? (
                            <div className="py-24 text-center space-y-6 rounded-[45px] border-2 border-dashed border-white/5 opacity-20">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto" />
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Vault is Empty</h3>
                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-loose">No synchronized attendance logs found<br/>for the current operational cycle.</p>
                                </div>
                            </div>
                        ) : (
                            attendanceData.map((item) => (
                                <div key={item.id} className="bg-[#161b22] border border-white/[0.05] p-6 rounded-[40px] relative overflow-hidden group shadow-2xl shadow-black/40 active:scale-[0.98] transition-all">
                                    <div className={cn(
                                        "absolute top-0 bottom-0 left-0 w-2 group-hover:w-3 border-r border-white/5",
                                        item.status === 'PRESENT' ? 'bg-emerald-500' :
                                            item.status === 'LATE' ? 'bg-amber-500' :
                                                item.status === 'OFF' ? 'bg-gray-800' : 'bg-rose-500'
                                    )}></div>

                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-white italic tracking-tight">{format(new Date(item.date), 'EEEE, MMM dd')}</p>
                                            <div className="flex items-center gap-4 bg-[#0d1117]/50 px-3 py-2 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-[10px] font-black text-gray-300 tracking-widest">
                                                        {item.checkIn ? format(new Date(item.checkIn), 'HH:mm') : 'TERMINAL'}
                                                    </span>
                                                </div>
                                                <div className="h-3 w-[1px] bg-white/10"></div>
                                                <div className="flex items-center gap-2">
                                                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="text-[10px] font-black text-gray-300 tracking-widest">
                                                        {item.checkOut ? format(new Date(item.checkOut), 'HH:mm') : 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-3">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border italic",
                                                item.status === 'PRESENT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                                    item.status === 'LATE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                        item.status === 'OFF' ? 'bg-gray-800 border-gray-700 text-gray-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                                            )}>
                                                {item.status}
                                            </span>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.hours !== '-' ? `${item.hours} Recorded` : 'Session Active'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-5 border-t border-white/[0.03] flex items-center justify-between">
                                        <div className="flex items-center gap-2 opacity-40">
                                            <MapPin className="w-3 h-3 text-blue-500" />
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">{item.location} Operations Link</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] rounded-full border border-white/5 opacity-40">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {roster.map((item, i) => (
                            <div key={i} className="bg-[#161b22] border border-white/[0.05] p-6 rounded-[40px] group transition-all shadow-2xl shadow-black/40 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                            <CalendarDays className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <p className="text-base font-black text-white italic tracking-tight">{item.date}</p>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-[12px] text-[9px] font-black uppercase tracking-widest border italic",
                                        item.shift === 'OFF' ? 'bg-rose-500/5 border-rose-500/20 text-rose-500 opacity-60' : 'bg-blue-600/10 border-blue-500/20 text-blue-500'
                                    )}>
                                        {item.shift} Cycle
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{item.time}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500/40"></div>
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] italic">{item.dep}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                        
                        {/* Protocol Awareness Banner */}
                        <div className="p-8 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-[45px] border border-blue-500/10 relative overflow-hidden group shadow-2xl shadow-indigo-600/10 mt-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-125 transition-transform duration-1000"></div>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="w-14 h-14 bg-[#161b22] rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                                    <Zap className="w-7 h-7 text-blue-500 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-white italic tracking-tight italic">AI Resource Deployment</h4>
                                    <p className="text-[10px] font-bold text-gray-500 leading-[1.8] uppercase tracking-[0.2em]">Operational cycles are optimized via property demand-prediction algorithms. Mod requests require lead clearance.</p>
                                </div>
                                <button className="h-12 px-8 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95">Request Modification</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
