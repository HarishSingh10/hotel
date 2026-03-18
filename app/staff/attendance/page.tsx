'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock,
    MapPin, ArrowUpRight, ArrowDownRight,
    Search, Filter, Loader2, Sparkles, User,
    CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

interface AttendanceRecord {
    id: string
    date: string
    checkIn: string | null
    checkOut: string | null
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'OFF'
    hours: string
    location: string
}

export default function AttendancePage() {
    const router = useRouter()
    const [view, setView] = useState<'HISTORY' | 'ROSTER'>('HISTORY')
    const [loading, setLoading] = useState(true)
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [currentMonth] = useState(new Date())

    const fetchAttendance = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/attendance')
            if (res.ok) {
                const data = await res.json()
                setAttendanceData(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAttendance()
    }, [fetchAttendance])

    const monthName = format(currentMonth, 'MMMM yyyy')

    const stats = [
        { label: 'Present', value: attendanceData.filter(a => a.status === 'PRESENT').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Late', value: attendanceData.filter(a => a.status === 'LATE').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Absent', value: attendanceData.filter(a => a.status === 'ABSENT').length, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ]

    const roster = [
        { date: 'Mon, Oct 30', shift: 'Morning', time: '07:00 AM - 03:00 PM', dep: 'Front Office' },
        { date: 'Tue, Oct 31', shift: 'Morning', time: '07:00 AM - 03:00 PM', dep: 'Front Office' },
        { date: 'Wed, Nov 01', shift: 'General', time: '09:00 AM - 05:00 PM', dep: 'Front Office' },
        { date: 'Thu, Nov 02', shift: 'Night', time: '10:00 PM - 06:00 AM', dep: 'Front Office' },
        { date: 'Fri, Nov 03', shift: 'OFF', time: '-', dep: '-' },
    ]

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-white tracking-tight italic">My Roster & History</h1>
                <div className="w-10"></div>
            </div>

            {/* Monthly Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map((s, i) => (
                    <div key={i} className="bg-[#161b22] border border-white/[0.05] p-4 rounded-2xl text-center">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2", s.bg)}>
                            <s.icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <p className="text-xl font-black text-white">{s.value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* View Switcher */}
            <div className="bg-[#161b22] p-1.5 rounded-2xl border border-white/[0.05] flex">
                <button
                    onClick={() => setView('HISTORY')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        view === 'HISTORY' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <Clock className="w-4 h-4" /> History
                </button>
                <button
                    onClick={() => setView('ROSTER')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        view === 'ROSTER' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <CalendarDays className="w-4 h-4" /> My Roster
                </button>
            </div>

            {/* Content List */}
            <div className="space-y-4 min-h-[400px]">
                {view === 'HISTORY' ? (
                    <div className="space-y-3">
                        {attendanceData.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                                <Calendar className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-gray-600">No attendance records</p>
                            </div>
                        ) : (
                            attendanceData.map((item, i) => (
                                <div key={item.id} className="bg-[#161b22] border border-white/[0.05] p-5 rounded-3xl relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
                                    <div className={cn(
                                        "absolute top-0 bottom-0 left-0 w-1",
                                        item.status === 'PRESENT' ? 'bg-emerald-500' :
                                            item.status === 'LATE' ? 'bg-amber-500' :
                                                item.status === 'OFF' ? 'bg-gray-700' : 'bg-rose-500'
                                    )}></div>

                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-white">{format(new Date(item.date), 'EEEE, MMM d')}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-emerald-500" /> {item.checkIn ? format(new Date(item.checkIn), 'hh:mm a') : '-'}</span>
                                                <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-rose-500" /> {item.checkOut ? format(new Date(item.checkOut), 'hh:mm a') : '-'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
                                                item.status === 'PRESENT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    item.status === 'LATE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                        item.status === 'OFF' ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-gray-700" />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Device Log: Staff Portal</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {roster.map((item, i) => (
                            <div key={i} className="bg-[#161b22] border border-white/[0.05] p-5 rounded-3xl group hover:border-white/10 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-black text-white italic">{item.date}</p>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                        item.shift === 'OFF' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'
                                    )}>
                                        {item.shift} Shift
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                                        <CalendarDays className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-300">{item.time}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{item.dep}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex items-center gap-4">
                            <Sparkles className="w-8 h-8 text-blue-500/40" />
                            <p className="text-[11px] font-bold text-blue-200/60 leading-relaxed italic">Your upcoming roster is generated based on the hotel&apos;s weekly capacity plan. Contact your manager for swaps.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
