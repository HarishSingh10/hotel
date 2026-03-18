'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    ChevronLeft, MapPin, Clock,
    CheckCircle2, AlertCircle, MessageSquare,
    Loader2, Camera, Info, ArrowRight,
    Star, Sparkles, Building2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export default function TaskDetailsPage() {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [task, setTask] = useState<any>(null)
    const [completing, setCompleting] = useState(false)
    const [message, setMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)

    const fetchTaskDetails = async () => {
        try {
            const res = await fetch(`/api/staff/tasks/${id}`)
            if (res.ok) {
                const data = await res.json()
                setTask(data)
            } else {
                toast.error('Task not found')
                router.push('/staff/tasks')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTaskDetails()
    }, [id])

    const handleComplete = async () => {
        setCompleting(true)
        try {
            const res = await fetch(`/api/staff/tasks/${id}/complete`, { method: 'POST' })
            if (res.ok) {
                toast.success('Task successfully completed!', {
                    description: 'Your stats have been updated.',
                    icon: <Sparkles className="w-4 h-4 text-amber-500" />
                })
                router.push('/staff/tasks')
            } else {
                toast.error('Failed to update task')
            }
        } catch (error) {
            toast.error('Error updating task')
        } finally {
            setCompleting(false)
        }
    }
    const handleSendMessage = async () => {
        if (!message.trim()) return
        setSendingMessage(true)
        try {
            const res = await fetch('/api/staff/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: message,
                    serviceRequestId: id,
                    category: 'TEAM'
                })
            })
            if (res.ok) {
                setMessage('')
                fetchTaskDetails()
                toast.success('Message sent')
            }
        } catch { toast.error('Failed to send') }
        finally { setSendingMessage(false) }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Loading Task Intelligence...</p>
        </div>
    )

    if (!task) return null

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-black text-white tracking-tight italic">Task Insight</h1>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">#{task.id.slice(-6)}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-blue-500">
                    <Sparkles className="w-4 h-4" />
                </div>
            </div>

            {/* Hero Image / Location Card */}
            <div className="relative h-60 rounded-[40px] overflow-hidden border border-white/[0.05] shadow-2xl">
                <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"
                    alt="Property"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-black/20 to-transparent"></div>
                
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-1 bg-blue-600 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
                            Priority: {task.priority}
                        </div>
                        <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                            {task.type}
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight mb-1">Room {task.room?.roomNumber || 'N/A'}</h2>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Grand Zenbourg • Floor 4</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                            <Building2 className="w-6 h-6 text-black" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                        <Info className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-black text-white italic tracking-tight">Assignment Directives</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Requested {formatDistanceToNow(new Date(task.createdAt))} ago</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-lg font-black text-white tracking-tight">{task.title}</h4>
                    <p className="text-xs font-medium text-gray-400 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03]">
                        {task.description || "Standard operating procedure applies. Ensure all premium touches are maintained. Check guest notes for specific layout preferences if available."}
                    </p>
                </div>

                {/* Checklist (Mock) */}
                <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Verification Checklist</span>
                    {[
                        "Sanitize all touchpoints",
                        "Confirm amenity stock levels",
                        "Digital system functional check"
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/[0.03]">
                            <div className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-gray-800" />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400">{step}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[32px] p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <button className="flex-1 h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                        <Camera className="w-5 h-5" />
                        Log Photo
                    </button>
                    <button 
                        onClick={() => document.getElementById('chat-input')?.focus()}
                        className="flex-1 h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Communicate
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Internal Thread</span>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {task.messages?.length === 0 ? (
                            <p className="text-[10px] text-gray-600 font-bold italic text-center py-4">No internal comms yet.</p>
                        ) : (
                            task.messages?.map((msg: any) => (
                                <div key={msg.id} className={cn(
                                    "p-3 rounded-2xl text-[11px] font-medium",
                                    msg.senderId === task.assignedTo?.userId 
                                        ? "bg-blue-600/10 text-blue-100 border border-blue-500/20 ml-8" 
                                        : "bg-white/[0.02] text-gray-400 border border-white/[0.05] mr-8"
                                )}>
                                    <p>{msg.content}</p>
                                    <span className="text-[8px] font-black uppercase opacity-40 mt-1 block">
                                        {msg.senderId === task.assignedTo?.userId ? 'You' : 'Management'} • {formatDistanceToNow(new Date(msg.createdAt))} ago
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            id="chat-input"
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type an update..."
                            className="flex-1 bg-black/20 border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/30 transition-all font-bold"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !message.trim()}
                            className="w-10 h-10 bg-blue-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95"
                        >
                            {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Complete Button */}
            <button
                onClick={handleComplete}
                disabled={completing}
                className={cn(
                    "w-full h-16 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl",
                    completing 
                        ? "bg-gray-800 text-gray-500" 
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                )}
            >
                {completing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Mark As Complete</span>
                    </>
                )}
            </button>
        </div>
    )
}
