'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Bell, BellOff,
    AlertCircle, ClipboardList, Wallet,
    Clock, CheckCircle2, MoreHorizontal,
    Zap, Sparkles, LayoutGrid, Loader2, Info, ArrowRight, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'

export default function NotificationsPage() {
    const router = useRouter()
    const [filter, setFilter] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<any[]>([])

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/notifications')
            if (res.ok) {
                const json = await res.json()
                setNotifications(json)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const markAllRead = async () => {
        try {
            await fetch('/api/staff/notifications', { method: 'PATCH', body: JSON.stringify({ isRead: true }) })
            fetchNotifications()
        } catch (error) {
            console.error(error)
        }
    }

    const markSingleRead = async (id: string) => {
        try {
            await fetch('/api/staff/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id, isRead: true }),
                headers: { 'Content-Type': 'application/json' }
            })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        } catch (error) {
            console.error(error)
        }
    }

    const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter)
    const unreadCount = notifications.filter(n => !n.isRead).length

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
                    <h1 className="text-xl font-black text-white tracking-tight italic">Operations Hub</h1>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5 italic underline underline-offset-4 decoration-blue-500/20">{unreadCount} Critical Alerts Pending</p>
                </div>
                <button
                    onClick={markAllRead}
                    className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
                >
                    Dismiss All
                </button>
            </div>

            {/* Filter Pills: Premium Glassmorphism */}
            <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-white/[0.05] gap-1 overflow-x-auto no-scrollbar shadow-inner shadow-black/40">
                {['ALL', 'ALERT', 'TASK', 'SYSTEM'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 active:scale-95",
                            filter === f ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {f === 'ALERT' ? 'Urgent' : f === 'TASK' ? 'Deployment' : f === 'SYSTEM' ? 'Terminal' : 'Global Log'}
                    </button>
                ))}
            </div>

            {/* Notifications Grid */}
            <div className="space-y-6">
                {filtered.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                        <div className="w-24 h-24 bg-white/[0.02] rounded-[40px] flex items-center justify-center mx-auto border border-dashed border-white/10 opacity-20 relative overflow-hidden group">
                            <BellOff className="w-10 h-10 text-gray-400" />
                            <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-hover:animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">All Quiet on Operations</h3>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-loose">The operations tunnel is clear.<br/>New dispatches will arrive here in real-time.</p>
                        </div>
                    </div>
                ) : (
                    filtered.map((note) => {
                        const Icon = note.type === 'ALERT' ? AlertCircle : note.type === 'TASK' ? ClipboardList : note.type === 'SYSTEM' ? Wallet : Bell
                        return (
                            <div
                                key={note.id}
                                onClick={() => !note.isRead && markSingleRead(note.id)}
                                className={cn(
                                    "bg-[#161b22] border group p-6 rounded-[40px] flex items-start gap-5 transition-all relative overflow-hidden active:scale-[0.98] shadow-2xl shadow-black/40",
                                    !note.isRead ? 'border-blue-500/20 bg-blue-500/[0.02]' : 'border-white/[0.03]'
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0 bottom-0 left-0 w-2 transition-all group-hover:w-3", 
                                    note.type === 'ALERT' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 
                                    note.type === 'TASK' ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 
                                    'bg-indigo-500'
                                )}></div>

                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:rotate-6",
                                    note.type === 'ALERT' ? "bg-rose-500/10 border-rose-500/20" :
                                        note.type === 'TASK' ? "bg-blue-600/10 border-blue-500/20" :
                                            "bg-indigo-500/10 border-indigo-500/20"
                                )}>
                                    <Icon className={cn("w-6 h-6",
                                        note.type === 'ALERT' ? "text-rose-500" :
                                            note.type === 'TASK' ? "text-blue-500" :
                                                "text-indigo-500"
                                    )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-[15px] font-black text-white tracking-tight italic leading-none">{note.title}</h4>
                                            {!note.isRead && (
                                                <div className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all duration-500 group-hover:bg-white/5",
                                            !note.isRead ? "border-blue-500/20 text-blue-500" : "border-white/5 text-gray-700"
                                        )}>
                                            {format(new Date(note.createdAt), 'hh:mm a')}
                                        </span>
                                    </div>
                                    <p className="text-[13px] font-medium text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors line-clamp-2 italic mb-4">{note.description}</p>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1 rounded-lg border border-white/[0.05]">
                                            <Clock className="w-3 h-3 text-gray-700" />
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                {isToday(new Date(note.createdAt)) ? 'Live Dispatch' :
                                                    isYesterday(new Date(note.createdAt)) ? 'Yesterday Log' :
                                                        format(new Date(note.createdAt), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Protocol Awareness Banner */}
            <div className="p-8 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-[45px] border border-blue-500/10 relative overflow-hidden group shadow-2xl shadow-indigo-600/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-125 transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-[#161b22] rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                        <ShieldCheck className="w-7 h-7 text-blue-500 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white italic tracking-tight italic">Protocol Multi-Channel</h4>
                        <p className="text-[10px] font-bold text-gray-500 leading-[1.8] uppercase tracking-[0.2em]">Operational dispatches are mirrored across terminal, mobile app, and property-broadcast systems.</p>
                    </div>
                    <button className="h-12 px-8 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95">Verify Channel Sync</button>
                </div>
            </div>
        </div>
    )
}
