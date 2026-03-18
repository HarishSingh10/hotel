'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Search, Plus,
    MoreHorizontal, Send,
    Check, CheckCheck, User,
    Sparkles, ShieldCheck, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function MessagesPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState('All')

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/messages')
            if (res.ok) {
                const json = await res.json()
                setMessages(json)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMessages()
        // Poll for new messages every 30 seconds
        const interval = setInterval(fetchMessages, 30000)
        return () => clearInterval(interval)
    }, [fetchMessages])

    const filteredMessages = messages.filter(msg => {
        const matchesSearch = msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Admin' && msg.category === 'ADMIN') ||
            (activeTab === 'Guests' && msg.category === 'GUEST')
        return matchesSearch && matchesTab
    })

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in max-h-screen flex flex-col pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-white tracking-tight italic">Communications</h1>
                <button className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-blue-500" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#161b22] border border-white/[0.05] rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-gray-700"
                />
            </div>

            {/* Tabs */}
            <div className="flex bg-[#161b22] p-1 rounded-2xl border border-white/[0.05]">
                {['All', 'Admin', 'Guests'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="space-y-2 overflow-y-auto min-h-[400px]">
                {filteredMessages.length === 0 ? (
                    <div className="py-20 text-center">
                        <User className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-600">No conversations found</p>
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className="bg-[#161b22] border border-white/[0.05] p-4 rounded-3xl flex items-center gap-4 group cursor-pointer hover:bg-white/[0.02] transition-colors relative"
                        >
                            <div className="relative shrink-0">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black tracking-tighter transition-all group-hover:scale-105",
                                    msg.category === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' :
                                        msg.category === 'GUEST' ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]' :
                                            'bg-gray-800 text-gray-500 border border-gray-700'
                                )}>
                                    {msg.senderId === 'system' ? 'SY' : 'UN'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-[#0d1117] flex items-center justify-center border border-white/5">
                                    {msg.category === 'ADMIN' ? <ShieldCheck className="w-3 h-3 text-amber-500" /> : <User className="w-3 h-3 text-blue-500" />}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-[14px] font-black text-white tracking-tight italic truncate pr-2">{msg.category} Channel</h4>
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className={cn(
                                        "text-xs truncate font-medium",
                                        !msg.isRead ? "text-gray-200 font-bold" : "text-gray-500"
                                    )}>
                                        {msg.content}
                                    </p>
                                    {!msg.isRead ? (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-600/20 animate-pulse"></div>
                                    ) : (
                                        <CheckCheck className="w-3.5 h-3.5 text-blue-500 opacity-40 shrink-0" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden mt-auto">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-xs font-black text-blue-300 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                        Priority Concierge
                    </h3>
                    <p className="text-[10px] text-blue-200/40 font-bold italic leading-relaxed">Direct guest requests always appear at the top. Respond within 5 minutes for SLA compliance.</p>
                </div>
            </div>
        </div>
    )
}
