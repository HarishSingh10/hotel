'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Bell, BellOff,
    AlertCircle, ClipboardList, Wallet,
    Clock, CheckCircle2, MoreHorizontal,
    Zap, Sparkles, LayoutGrid, Loader2
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
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-black text-white tracking-tight italic">Notifications</h1>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{unreadCount} Unread alerts</p>
                </div>
                <button
                    onClick={markAllRead}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                    Mark Read
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-white/[0.05] gap-1 overflow-x-auto no-scrollbar">
                {['ALL', 'ALERT', 'TASK', 'SYSTEM'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                            filter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {f === 'ALERT' ? 'Alerts' : f === 'TASK' ? 'Tasks' : f === 'SYSTEM' ? 'System' : 'All'}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                            <BellOff className="w-10 h-10 text-gray-700" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-600">No new notifications</p>
                    </div>
                ) : (
                    filtered.map((note) => {
                        const Icon = note.type === 'ALERT' ? AlertCircle : note.type === 'TASK' ? ClipboardList : note.type === 'SYSTEM' ? Wallet : Bell
                        return (
                            <div
                                key={note.id}
                                onClick={() => !note.isRead && markSingleRead(note.id)}
                                className={cn(
                                    "bg-[#161b22] border p-5 rounded-3xl flex items-start gap-4 transition-all relative overflow-hidden group hover:bg-white/[0.02] cursor-pointer",
                                    !note.isRead ? 'border-blue-500/30' : 'border-white/[0.05]'
                                )}
                            >
                                <div className={cn("absolute top-0 bottom-0 left-0 w-1", note.type === 'ALERT' ? 'bg-rose-500' : note.type === 'TASK' ? 'bg-blue-600' : 'bg-emerald-500')}></div>

                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                    note.type === 'ALERT' ? "bg-rose-500/10 border-rose-500/20" :
                                        note.type === 'TASK' ? "bg-blue-600/10 border-blue-500/20" :
                                            "bg-emerald-500/10 border-emerald-500/20"
                                )}>
                                    <Icon className={cn("w-6 h-6",
                                        note.type === 'ALERT' ? "text-rose-500" :
                                            note.type === 'TASK' ? "text-blue-500" :
                                                "text-emerald-500"
                                    )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="text-[14px] font-black text-white tracking-tight italic leading-none">{note.title}</h4>
                                        {!note.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 leading-relaxed mb-3">{note.description}</p>
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                        {isToday(new Date(note.createdAt)) ? `Today, ${format(new Date(note.createdAt), 'HH:mm')}` :
                                            isYesterday(new Date(note.createdAt)) ? `Yesterday, ${format(new Date(note.createdAt), 'HH:mm')}` :
                                                format(new Date(note.createdAt), 'MMM dd, HH:mm')}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Premium Note */}
            <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-6 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/10 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-1000"></div>
                <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                <h4 className="text-sm font-black text-blue-100 italic tracking-tight">Stay updated in real-time</h4>
                <p className="text-[10px] font-bold text-blue-200/40 leading-relaxed uppercase tracking-widest">Enable system push notifications to never miss an urgent guest request or shift update.</p>
                <button className="mt-2 px-6 py-2 bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Enable Now</button>
            </div>
        </div>
    )
}
