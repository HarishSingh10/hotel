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
            // Group by serviceRequestId first, then by category
            const key = msg.serviceRequestId || msg.category || 'GENERAL'
            if (!groups[key]) groups[key] = []
            groups[key].push(msg)
        })

        return Object.entries(groups).map(([id, msgs]) => {
            const lastMsg = msgs[0] // API returns desc
            const serviceRequest = lastMsg.serviceRequest
            
            return {
                id,
                title: serviceRequest 
                    ? `Sector: ${serviceRequest.room?.roomNumber || 'HQ'} - ${serviceRequest.title}`
                    : `${lastMsg.category || 'DIRECT'} FEED`,
                category: lastMsg.category || 'GENERAL',
                messages: [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
                lastMessage: lastMsg,
                unreadCount: msgs.filter(m => !m.isRead && m.senderId !== 'system').length,
                isService: !!serviceRequest,
                serviceRequestId: lastMsg.serviceRequestId
            }
        })
    }, [messages])

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Admin' && conv.category === 'ADMIN') ||
            (activeTab === 'Guests' && (conv.category === 'GUEST' || conv.isService))
        return matchesSearch && matchesTab
    })

    const handleSendReply = async () => {
        if (!replyContent.trim() || !selectedConversation) return
        setSending(true)
        
        const conv = conversations.find(c => c.id === selectedConversation)
        
        try {
            const res = await fetch('/api/staff/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: conv?.category,
                    serviceRequestId: conv?.serviceRequestId,
                    content: replyContent,
                    type: 'TEXT'
                })
            })

            if (res.ok) {
                setReplyContent('')
                fetchMessages()
            } else {
                toast.error('Dispatch failure')
            }
        } catch (error) {
            toast.error('Comm error')
        } finally {
            setSending(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing Comms Intel...</p>
        </div>
    )

    if (selectedConversation) {
        const conversation = conversations.find(c => c.id === selectedConversation)
        return (
            <div className="flex flex-col h-[90vh] -mt-10 -mx-4 animate-slide-up bg-[#0d1117] relative z-[60]">
                {/* Chat Header */}
                <div className="p-6 bg-[#161b22] border-b border-white/[0.05] flex items-center justify-between sticky top-0 z-20 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedConversation(null)} className="p-3 bg-white/[0.02] rounded-xl text-gray-400 hover:text-white transition-all active:scale-95">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h3 className="text-[14px] font-black text-white italic truncate max-w-[200px]">{conversation?.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500">Active Operational Link</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                           <Sparkles className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
                    {conversation?.messages.map((msg, i) => {
                        // Assuming session.user.id is accessible or inferred as self
                        const isSelf = msg.senderId !== 'system' && msg.senderId !== 'guest' 
                        return (
                            <div key={msg.id} className={cn("flex flex-col group", isSelf ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] p-4 rounded-[28px] text-[13px] font-medium leading-relaxed relative transition-all",
                                    isSelf 
                                        ? "bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-500/10" 
                                        : "bg-[#161b22] text-white border border-white/[0.05] rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                                <div className="flex items-center gap-2 mt-2 px-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                    </span>
                                    {isSelf && <CheckCheck className="w-2.5 h-2.5 text-blue-500 opacity-40" />}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#161b22]/90 backdrop-blur-2xl border border-white/[0.05] p-3 rounded-[35px] shadow-3xl">
                    <div className="flex gap-3 bg-black/40 p-2 rounded-[28px] border border-white/[0.05]">
                        <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                            placeholder="Input command update..."
                            className="flex-1 bg-transparent border-none outline-none text-xs text-white px-5 font-bold placeholder:text-gray-800"
                        />
                        <button
                            onClick={handleSendReply}
                            disabled={sending || !replyContent.trim()}
                            className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-20"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in flex flex-col pb-12">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-[18px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-500 hover:text-white transition-all active:scale-95 shadow-inner"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase underline underline-offset-8 decoration-blue-500/20 leading-none mb-2">Communications</h1>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic">Operational Intelligence Center</p>
                </div>
                <div className="w-12 h-12 rounded-[18px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <MessageCircle className="w-5 h-5" />
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative overflow-hidden rounded-[30px] shadow-3xl">
                <div className="absolute inset-0 bg-blue-600/5 blur-xl pointer-events-none"></div>
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                <input
                    type="text"
                    placeholder="Search Intel Feeds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#161b22] border border-white/[0.03] rounded-[30px] pl-16 pr-6 py-6 text-[13px] text-white outline-none focus:border-blue-500/30 transition-all font-bold placeholder:text-gray-800"
                />
            </div>

            {/* Tabs */}
            <div className="flex bg-[#161b22] p-1.5 rounded-[26px] border border-white/[0.05] shadow-inner">
                {['All', 'Admin', 'Guests'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                            activeTab === tab 
                                ? "bg-white text-blue-700 shadow-xl shadow-white/5" 
                                : "text-gray-600 hover:text-gray-400"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="space-y-4 min-h-[400px]">
                {filteredConversations.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                        <div className="w-24 h-24 bg-white/[0.02] rounded-[40px] flex items-center justify-center mx-auto border border-dashed border-white/10 shadow-inner group">
                            <MessageCircle className="w-10 h-10 text-gray-800 group-hover:scale-110 transition-transform opacity-20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-700 italic">No incoming intelligence</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv.id)}
                            className="bg-[#161b22] border border-white/[0.03] p-6 rounded-[40px] flex items-center gap-5 group cursor-pointer hover:bg-white/[0.02] transition-all relative overflow-hidden shadow-xl active:scale-[0.98]"
                        >
                            <div className="relative shrink-0">
                                <div className={cn(
                                    "w-16 h-16 rounded-[22px] flex items-center justify-center text-xl font-black tracking-tighter transition-all group-hover:scale-105 border",
                                    conv.category === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    conv.isService ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    'bg-blue-600/10 text-blue-500 border-blue-600/20'
                                )}>
                                    {conv.isService ? <Zap className="w-6 h-6" /> : conv.category.slice(0, 2)}
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-xl bg-blue-600 text-white text-[10px] font-black flex items-center justify-center border-4 border-[#161b22] shadow-lg shadow-blue-500/40">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>
 
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[14px] font-black text-white italic tracking-tighter truncate pr-2 uppercase italic">{conv.title}</h4>
                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-full">
                                        {format(new Date(conv.lastMessage.createdAt), 'HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className={cn(
                                        "text-[12px] truncate font-medium leading-relaxed italic",
                                        conv.unreadCount > 0 ? "text-blue-100 font-bold" : "text-gray-600"
                                    )}>
                                        {conv.lastMessage.content}
                                    </p>
                                    <ArrowRight className="w-4 h-4 text-gray-800 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
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
