'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Search, Plus,
    MoreHorizontal, Send,
    Check, CheckCheck, User,
    Sparkles, ShieldCheck, Loader2,
    ArrowLeft, MessageCircle, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { toast } from 'sonner'

export default function MessagesPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState('All')
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [sending, setSending] = useState(false)

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
        const interval = setInterval(fetchMessages, 30000)
        return () => clearInterval(interval)
    }, [fetchMessages])

    // Group messages into conversations based on category (since it's a simple categorization)
    const conversations = useMemo(() => {
        const groups: Record<string, any[]> = {}
        messages.forEach(msg => {
            const key = msg.category || 'CHAT'
            if (!groups[key]) groups[key] = []
            groups[key].push(msg)
        })
        return Object.entries(groups).map(([category, msgs]) => ({
            id: category,
            category,
            messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            lastMessage: msgs[0], // first in sorted by desc from API
            unreadCount: msgs.filter(m => !m.isRead).length
        }))
    }, [messages])

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Admin' && conv.category === 'ADMIN') ||
            (activeTab === 'Guests' && conv.category === 'GUEST')
        return matchesSearch && matchesTab
    })

    const handleSendReply = async () => {
        if (!replyContent.trim() || !selectedConversation) return
        setSending(true)
        try {
            const res = await fetch('/api/staff/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: selectedConversation,
                    content: replyContent,
                    type: 'TEXT'
                })
            })

            if (res.ok) {
                setReplyContent('')
                fetchMessages()
            } else {
                toast.error('Failed to send message')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setSending(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    if (selectedConversation) {
        const conversation = conversations.find(c => c.id === selectedConversation)
        return (
            <div className="flex flex-col h-[85vh] -mt-6 -mx-4 animate-slide-up bg-[#0d1117]">
                {/* Chat Header */}
                <div className="p-4 bg-[#161b22] border-b border-white/[0.05] flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedConversation(null)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h3 className="text-sm font-black text-white italic">{conversation?.category} Channel</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Live Feedback Loop</span>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {conversation?.messages.map((msg, i) => {
                        const isSelf = msg.senderId !== 'system' // Mock logic for demo
                        return (
                            <div key={msg.id} className={cn("flex flex-col", isSelf ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[80%] p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed relative group",
                                    isSelf 
                                        ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10" 
                                        : "bg-[#161b22] text-gray-300 border border-white/[0.05] rounded-tl-none"
                                )}>
                                    {msg.content}
                                    <div className={cn(
                                        "absolute top-0 w-2 h-2",
                                        isSelf ? "right-[-8px] border-l-[8px] border-l-blue-600 border-b-[8px] border-b-transparent" 
                                               : "left-[-8px] border-r-[8px] border-r-[#161b22] border-b-[8px] border-b-transparent"
                                    )}></div>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 mt-1.5 px-1">
                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                    {isSelf && <CheckCheck className="w-2.5 h-2.5 inline ml-1 text-blue-500" />}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#161b22]/80 backdrop-blur-xl border-t border-white/[0.05] pb-safe-offset-4">
                    <div className="flex gap-2 p-1.5 bg-[#0d1117] rounded-2xl border border-white/[0.05]">
                        <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white px-3 font-bold placeholder:text-gray-700"
                        />
                        <button
                            onClick={handleSendReply}
                            disabled={sending || !replyContent.trim()}
                            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in flex flex-col pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-black text-white tracking-tight italic">Communications</h1>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Hotel Operations Desk</p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400">
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
                    className="w-full bg-[#161b22] border border-white/[0.05] rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-gray-700 shadow-2xl shadow-black/20"
                />
            </div>

            {/* Tabs */}
            <div className="flex bg-[#161b22] p-1 rounded-2xl border border-white/[0.05]">
                {['All', 'Admin', 'Guests'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="space-y-3 min-h-[400px]">
                {filteredConversations.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                            <MessageCircle className="w-10 h-10 text-gray-800" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-600">No active channels</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv.id)}
                            className="bg-[#161b22] border border-white/[0.05] p-5 rounded-[32px] flex items-center gap-4 group cursor-pointer hover:bg-white/[0.02] transition-colors relative overflow-hidden"
                        >
                            <div className="relative shrink-0">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black tracking-tighter transition-all group-hover:scale-105 border",
                                    conv.category === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.05)]' :
                                        conv.category === 'GUEST' ? 'bg-blue-600/10 text-blue-500 border-blue-600/20 shadow-[0_0_25px_rgba(37,99,235,0.05)]' :
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                )}>
                                    {conv.category.slice(0, 2)}
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-[#161b22] animate-bounce">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-[14px] font-black text-white tracking-tight italic truncate pr-2 uppercase">{conv.category} FEED</h4>
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                        {isToday(new Date(conv.lastMessage.createdAt)) ? format(new Date(conv.lastMessage.createdAt), 'HH:mm') :
                                         isYesterday(new Date(conv.lastMessage.createdAt)) ? 'Yesterday' :
                                         format(new Date(conv.lastMessage.createdAt), 'MMM dd')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className={cn(
                                        "text-xs truncate font-medium leading-relaxed",
                                        conv.unreadCount > 0 ? "text-gray-200 font-bold" : "text-gray-500"
                                    )}>
                                        {conv.lastMessage.content}
                                    </p>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Actions / Concierge */}
            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/10 rounded-3xl p-6 flex flex-col items-center text-center space-y-3 relative overflow-hidden mt-auto shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:translate-x-12 transition-all duration-1000"></div>
                <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                <h3 className="text-sm font-black text-blue-100 italic tracking-tight uppercase">Operational SLA</h3>
                <p className="text-[10px] text-blue-200/40 font-bold leading-relaxed uppercase tracking-[0.2em]">Respond within 3 mins for Guest category and 15 mins for Admin. Your performance rating depends on it.</p>
            </div>
        </div>
    )
}
