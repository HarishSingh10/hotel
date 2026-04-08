'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertCircle, CheckCircle2, Clock,
    ChevronLeft, Filter, Search,
    ArrowRight, MapPin, Loader2,
    Calendar, MoreHorizontal, Sparkles,
    LayoutGrid, ClipboardList, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function StaffTasksPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState<any[]>([])
    const [filter, setFilter] = useState('ALL')

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/me')
            if (res.ok) {
                const json = await res.json()
                setTasks(json.tasks)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    const categories = [
        { id: 'ALL', label: 'All Tasks', count: tasks.length },
        { id: 'URGENT', label: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT').length },
        { id: 'PENDING', label: 'Pending', count: tasks.filter(t => t.status === 'PENDING').length },
    ]

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header / Premium Search */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center px-4">
                    <h1 className="text-xl font-black text-white tracking-tight italic">Work Queue</h1>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5 italic">Live Operations Tunnel</p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 active:scale-95 transition-all">
                    <Search className="w-4 h-4" />
                </button>
            </div>

            {/* Filter Pills: Glassmorphism */}
            <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-white/[0.05] gap-1 overflow-x-auto no-scrollbar shadow-inner shadow-black/40">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2",
                            filter === cat.id
                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {cat.label}
                        {cat.count > 0 && (
                            <span className={cn(
                                "w-4 h-4 rounded-md flex items-center justify-center text-[8px]",
                                filter === cat.id ? "bg-white/20 text-white" : "bg-white/5 text-gray-600"
                            )}>
                                {cat.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Task Grid: Premium Cards */}
            <div className="grid grid-cols-1 gap-6">
                {tasks.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                        <div className="w-24 h-24 bg-white/[0.02] rounded-[40px] flex items-center justify-center mx-auto border border-dashed border-white/10 opacity-20 group relative overflow-hidden">
                            <ClipboardList className="w-10 h-10 text-gray-400" />
                            <div className="absolute inset-0 bg-blue-500/10 blur-2xl animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">All Units Operational</h3>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-loose">No active tasks assigned to your queue.<br/>New tasks will appear in real-time.</p>
                        </div>
                    </div>
                ) : (
                    tasks.map((task: any) => (
                        <div
                            key={task.id}
                            onClick={() => router.push(`/staff/tasks/${task.id}`)}
                            className="bg-[#161b22] rounded-[40px] overflow-hidden border border-white/[0.05] group hover:border-white/10 transition-all flex flex-col relative active:scale-[0.98] shadow-2xl shadow-black/40"
                        >
                            <div className={cn(
                                "absolute top-0 bottom-0 left-0 w-2 transition-all group-hover:w-3",
                                task.priority === 'URGENT' ? 'bg-rose-500' : 'bg-blue-600'
                            )}></div>

                            {/* Task Info Body */}
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:bg-blue-600/10 transition-all duration-500">
                                            <LayoutGrid className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-white italic tracking-tight">Room {task.room?.roomNumber || 'Gen-Ops'}</h4>
                                            <div className="flex items-center gap-3 mt-1 underline-offset-4 decoration-white/10">
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                                    task.priority === 'URGENT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                )}>
                                                    {task.priority || 'Standard'}
                                                </span>
                                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{format(new Date(task.createdAt), 'hh:mm a')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-gray-800" />
                                </div>
                                
                                <h3 className="text-xl font-black text-white tracking-tight italic mb-3 group-hover:text-blue-500 transition-colors leading-snug">{task.title}</h3>
                                <p className="text-[13px] font-medium text-gray-500 leading-relaxed line-clamp-2 italic">{task.description || 'Proceed with standard operating procedures and verify upon completion.'}</p>
                                
                                <div className="mt-8 flex items-center gap-4">
                                    <button
                                        className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <Sparkles className="w-4 h-4 text-blue-500" /> View Directives
                                    </button>
                                    <button className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 transition-all active:scale-[0.85]">
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Support Note */}
            <div className="p-6 bg-blue-600/5 rounded-[40px] border border-blue-500/10 flex items-start gap-4 mx-2">
                <Info className="w-5 h-5 text-blue-500/40 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-200/40 leading-relaxed uppercase tracking-widest italic">Tasks are assigned based on current room status and priority algorithms. For issues, contact Ops-Command directly.</p>
            </div>
        </div>
    )
}

