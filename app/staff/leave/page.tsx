'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar, ChevronLeft, Send,
    Clock, CheckCircle2, AlertCircle, X,
    Umbrella, Stethoscope, Briefcase, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'

export default function LeavePage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [leaveType, setLeaveType] = useState('ANNUAL')
    const [reason, setReason] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [data, setData] = useState<any>({ balances: {}, history: [] })

    const fetchLeaveData = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/leave')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLeaveData()
    }, [fetchLeaveData])

    const totalDays = (startDate && endDate)
        ? differenceInDays(new Date(endDate), new Date(startDate)) + 1
        : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!startDate || !endDate || !reason) {
            toast.error('Please fill all fields')
            return
        }
        if (totalDays <= 0) {
            toast.error('End date must be after start date')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/staff/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaveType,
                    startDate,
                    endDate,
                    totalDays,
                    reason
                })
            })

            if (res.ok) {
                toast.success('Leave request submitted successfully')
                setReason('')
                setStartDate('')
                setEndDate('')
                fetchLeaveData()
            } else {
                toast.error('Failed to submit request')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    const leaveStats = [
        { label: 'Annual Leave', value: `${data.balances.annual || 0} Days`, icon: Umbrella, color: 'text-emerald-500', bg: 'bg-emerald-500/10', progress: 'bg-emerald-500', current: data.balances.annual, max: 15 },
        { label: 'Sick Leave', value: `${data.balances.sick || 0} Days`, icon: Stethoscope, color: 'text-amber-500', bg: 'bg-amber-500/10', progress: 'bg-amber-500', current: data.balances.sick, max: 10 },
        { label: 'Casual Leave', value: `${data.balances.casual || 0} Days`, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-500/10', progress: 'bg-purple-500', current: data.balances.casual, max: 7 },
    ]

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
                <h1 className="text-xl font-black text-white tracking-tight italic">Apply for Leave</h1>
                <div className="w-10"></div>
            </div>

            {/* Leave Balances */}
            <div className="grid grid-cols-1 gap-4">
                {leaveStats.map((stat, i) => (
                    <div key={i} className="bg-[#161b22] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</p>
                                    <p className="text-xl font-black text-white">{stat.value}</p>
                                </div>
                            </div>
                            <stat.icon className={cn("w-8 h-8 opacity-5 -mr-2 -mt-2 group-hover:opacity-10 transition-opacity", stat.color)} />
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000", stat.progress)}
                                style={{ width: `${(stat.current / stat.max) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Request Form */}
            <form onSubmit={handleSubmit} className="bg-[#161b22] border border-white/[0.05] rounded-3xl p-6 space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block text-center">Leave Type</label>
                    <div className="flex bg-[#0d1117] p-1 rounded-xl border border-white/[0.05] overflow-x-auto no-scrollbar">
                        {['ANNUAL', 'SICK', 'CASUAL', 'UNPAID'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setLeaveType(type)}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                                    leaveType === type ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {type === 'ANNUAL' ? 'Annual' : type === 'SICK' ? 'Sick' : type === 'CASUAL' ? 'Casual' : 'Unpaid'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Start Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-[#0d1117] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-bold"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">End Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-[#0d1117] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-bold"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Reason for request</label>
                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Family vacation, Medical appointment..."
                        className="w-full bg-[#0d1117] border border-white/[0.05] rounded-2xl px-4 py-4 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-gray-700 resize-none"
                    ></textarea>
                </div>

                {startDate && endDate && totalDays > 0 && (
                    <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Selected Duration</p>
                            <p className="text-[13px] font-black text-white">{totalDays} Days</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Return Date</p>
                            <p className="text-[13px] font-black text-white">{format(new Date(endDate), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                )}

                <button
                    disabled={submitting}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Leave Request <Send className="w-4 h-4" /></>}
                </button>
            </form>

            {/* Recent Requests */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic ml-2">Recent Requests</h3>
                <div className="space-y-3">
                    {data.history.length === 0 ? (
                        <div className="py-10 text-center bg-[#161b22] rounded-3xl border border-dashed border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No recent requests</p>
                        </div>
                    ) : (
                        data.history.map((req: any, i: number) => (
                            <div key={i} className="bg-[#161b22] border border-white/[0.05] p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        req.status === 'APPROVED' ? 'bg-emerald-500/10' :
                                            req.status === 'REJECTED' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                                    )}>
                                        {req.status === 'APPROVED' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                                            req.status === 'REJECTED' ? <X className="w-5 h-5 text-rose-500" /> : <Clock className="w-5 h-5 text-blue-500" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-[13px] font-black text-white">{req.leaveType}</h4>
                                            <span className="text-[9px] font-bold text-gray-600">• {req.totalDays} Days</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border relative z-10",
                                    req.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                        req.status === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                )}>
                                    {req.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
