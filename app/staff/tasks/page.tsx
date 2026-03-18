'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertCircle, CheckCircle2, Clock,
    ChevronLeft, Filter, Search,
    ArrowRight, MapPin, Loader2,
    Calendar, MoreHorizontal, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function StaffTasksPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState<any[]>([])
    const [filter, setFilter] = useState('ALL')

    const fetchTasks = async () => {
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
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleComplete = async (taskId: string) => {
        try {
            const res = await fetch(`/api/staff/tasks/${taskId}/complete`, { method: 'POST' })
            if (res.ok) {
                toast.success('Task marked as completed')
                fetchTasks()
            } else {
                toast.error('Failed to update task')
            }
        } catch (error) {
            toast.error('Error updating task')
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    const categories = [
        { id: 'ALL', label: 'All Tasks', count: tasks.length },
        { id: 'URGENT', label: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT').length },
        { id: 'HOUSEKEEPING', label: 'Cleaning', count: 4 },
        { id: 'MAINTENANCE', label: 'Technical', count: 1 },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-white tracking-tight italic">My Queue</h1>
                <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400">
                    <Search className="w-4 h-4" />
                </button>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={cn(
                            "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2",
                            filter === cat.id
                                ? "bg-white text-black shadow-xl"
                                : "bg-[#161b22] text-gray-500 border border-white/[0.05] hover:text-gray-300"
                        )}
                    >
                        {cat.label}
                        {cat.count > 0 && (
                            <span className={cn(
                                "w-4 h-4 rounded-md flex items-center justify-center text-[8px]",
                                filter === cat.id ? "bg-black text-white" : "bg-white/10 text-gray-400"
                            )}>
                                {cat.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 gap-6">
                {tasks.map((task: any) => (
                    <div
                        key={task.id}
                        className="bg-[#161b22] rounded-[32px] overflow-hidden border border-white/[0.05] group hover:border-white/10 transition-all flex flex-col relative"
                    >
                        {/* Task Image (Simulated) */}
                        <div className="h-44 w-full relative">
                            <img
                                src={task.priority === 'URGENT'
                                    ? "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400"
                                    : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400"
                                }
                                alt=""
                                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] via-transparent to-transparent"></div>

                            {/* Badges */}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest backdrop-blur-md border flex items-center gap-1.5",
                                    task.priority === 'URGENT'
                                        ? "bg-rose-500/20 border-rose-500/30 text-rose-500"
                                        : "bg-blue-600/20 border-blue-500/30 text-blue-400"
                                )}>
                                    <Clock className="w-3 h-3" />
                                    {task.priority === 'URGENT' ? 'Urgent Response' : 'Scheduled Task'}
                                </span>
                                <button className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 pt-2">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-blue-600/10 rounded-lg">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Hotel • Room {task.room?.roomNumber || 'N/A'}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-white tracking-tight italic mb-2">{task.title}</h3>
                            <p className="text-xs font-bold text-gray-500 leading-relaxed line-clamp-2 mb-6">{task.description || 'No specific instructions provided. Follow standard SOP.'}</p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push(`/staff/tasks/${task.id}`)}
                                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" /> View Directives
                                </button>
                                <button className="w-12 h-12 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                            <CheckCircle2 className="w-10 h-10 text-gray-700" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">All Caught Up!</h3>
                            <p className="text-xs font-bold text-gray-600 mt-2">Check back later for new assignments.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

