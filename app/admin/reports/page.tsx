'use client'

import React, { useState, useEffect } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, PieChart, Pie, Cell
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Calendar, Lock, Download, ChevronDown, Star } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/common/Avatar'
import { formatCurrency } from '@/lib/utils'
import { buildContextUrl } from '@/lib/admin-context'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { downloadCSV } from '@/lib/csv'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function ReportsPage() {
    const { data: session } = useSession()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [trendView, setTrendView] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily')

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch(buildContextUrl('/api/admin/reports'))
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        if (['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(session?.user?.role || '')) {
            fetchReports()
        }
    }, [session])

    const handleExport = () => {
        if (!data) return
        const reportData = [
            { Metric: 'Total Revenue', Value: `$${data.totalRevenue}` },
            { Metric: 'Avg Occupancy', Value: `${data.avgOccupancy}%` },
            { Metric: 'Net Promoter Score', Value: data.nps },
            { Metric: 'SLA Breaches', Value: data.slaBreaches },
        ]
        downloadCSV(reportData, 'Reports_Analytics')
        toast.success('Report exported to CSV')
    }

    if (!['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(session?.user?.role || '')) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse">
                    <Lock className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-3">Restricted Access</h1>
                <p className="text-lg text-text-secondary max-w-md">
                    Analytics and Reports are restricted to Property Administrators.
                </p>
                <Button variant="secondary" className="mt-8" onClick={() => window.history.back()}>Go Back</Button>
            </div>
        )
    }

    const periodLabel = data
        ? `${new Date(data.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(data.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : '...'

    // Aggregate trend data for weekly/monthly views
    const getAggregatedTrend = () => {
        if (!data?.trendData) return []
        if (trendView === 'Daily') return data.trendData

        const chunkSize = trendView === 'Weekly' ? 7 : 30
        const result: any[] = []
        for (let i = 0; i < data.trendData.length; i += chunkSize) {
            const chunk = data.trendData.slice(i, i + chunkSize)
            const avgRev = Math.round(chunk.reduce((s: number, d: any) => s + d.revenue, 0) / chunk.length)
            const avgOcc = Math.round(chunk.reduce((s: number, d: any) => s + d.occupancy, 0) / chunk.length)
            result.push({ name: chunk[0].name, revenue: avgRev, occupancy: avgOcc })
        }
        return result
    }

    const sentimentData = data?.sentimentBreakdown ? [
        { name: 'Positive', value: data.sentimentBreakdown.positive },
        { name: 'Neutral', value: data.sentimentBreakdown.neutral },
        { name: 'Negative', value: data.sentimentBreakdown.negative },
    ] : []

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)
        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        return 'Just now'
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Reports & Analytics</h1>
                    <p className="text-text-secondary mt-1 text-sm">Overview of key hotel performance metrics</p>
                </div>
                <div className="flex gap-3 items-center">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-bold text-text-secondary hover:bg-white/[0.06] transition-all">
                        <Calendar className="w-4 h-4" />
                        <span>{periodLabel}</span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>
                    <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="h-28 animate-pulse bg-surface border-white/[0.05]" />
                    ))}
                </div>
            ) : data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Revenue */}
                    <Card className="p-5 border-white/[0.05] hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Total Revenue</p>
                            <span className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg ${data.revenueTrend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                {data.revenueTrend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {Math.abs(data.revenueTrend)}%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary tracking-tight">{formatCurrency(data.totalRevenue)}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-1">vs. {formatCurrency(data.lastMonthRevenue)} last month</p>
                    </Card>

                    {/* Avg Occupancy */}
                    <Card className="p-5 border-white/[0.05] hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Avg Occupancy</p>
                            <span className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg ${data.occTrend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                {data.occTrend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {Math.abs(data.occTrend)}%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary tracking-tight">{data.avgOccupancy}%</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-1">vs. {data.lastMonthOccupancy}% last month</p>
                    </Card>

                    {/* Net Promoter Score */}
                    <Card className="p-5 border-white/[0.05] hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Net Promoter Score</p>
                            <span className="flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg text-emerald-400 bg-emerald-500/10">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />2
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary tracking-tight">{data.nps}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-1">Top 10% of industry</p>
                    </Card>

                    {/* SLA Breaches */}
                    <Card className="p-5 border-white/[0.05] hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">SLA Breaches</p>
                            <span className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg ${data.slaTrend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                {data.slaTrend >= 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                                {Math.abs(data.slaTrend)}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary tracking-tight">{data.slaBreaches}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-1">Response &gt; 30mins</p>
                    </Card>
                </div>
            )}

            {/* Charts Row */}
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-6">
                    {/* Revenue vs Occupancy Trends */}
                    <Card className="p-6 border-white/[0.05] bg-surface">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">Revenue vs. Occupancy Trends</h3>
                                <p className="text-xs text-text-secondary mt-0.5">Daily RevPAR & Occupancy %</p>
                            </div>
                            <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                                {(['Daily', 'Weekly', 'Monthly'] as const).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setTrendView(v)}
                                        className={`px-4 py-1.5 text-xs font-bold transition-all ${trendView === v ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getAggregatedTrend()}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4A9EFF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4A9EFF" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 12, fontWeight: 'bold' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        formatter={(val: number, name: string) => name === 'Revenue' ? [`$${val.toLocaleString()}`, name] : [`${val}%`, name]}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#4A9EFF" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} dot={false} />
                                    <Area yAxisId="right" type="monotone" dataKey="occupancy" name="Occupancy" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOcc)" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Right Column: SLA + Sentiment */}
                    <div className="space-y-6">
                        {/* SLA Compliance */}
                        <Card className="p-6 border-white/[0.05] bg-surface">
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-text-primary">Service SLA Compliance</h3>
                                <p className="text-xs text-text-secondary mt-0.5">Response time by department</p>
                            </div>
                            <div className="space-y-5">
                                {data.slaByDept?.map((dept: any) => {
                                    const color = dept.compliance >= 95 ? '#10b981' : dept.compliance >= 85 ? '#f59e0b' : '#ef4444'
                                    return (
                                        <div key={dept.department} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-text-secondary capitalize">{dept.department}</span>
                                                <span className="text-xs font-bold text-text-primary">{dept.compliance}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${dept.compliance}%`, backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        {/* Guest Sentiment */}
                        <Card className="p-6 border-white/[0.05] bg-surface">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-text-primary">Guest Sentiment Breakdown</h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="relative w-28 h-28 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sentimentData}
                                                cx="50%" cy="50%"
                                                innerRadius={32} outerRadius={48}
                                                paddingAngle={4}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {sentimentData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-bold text-text-primary">{data.sentimentBreakdown?.avgRating || '0'}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 text-xs font-bold">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span className="text-text-secondary">Positive ({data.sentimentBreakdown?.positive || 0}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        <span className="text-text-secondary">Neutral ({data.sentimentBreakdown?.neutral || 0}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        <span className="text-text-secondary">Negative ({data.sentimentBreakdown?.negative || 0}%)</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Bottom Row: Leaderboard + Feedback */}
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Staff Leaderboard */}
                    <Card className="p-6 border-white/[0.05] bg-surface">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-text-primary">Staff Leaderboard</h3>
                            <button className="text-xs font-bold text-primary hover:brightness-125 transition-all uppercase tracking-widest">View All</button>
                        </div>
                        <div className="space-y-4">
                            {data.leaderboard?.length > 0 ? data.leaderboard.map((staff: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <Avatar name={staff.name} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-primary truncate">{staff.name}</p>
                                        <p className="text-[11px] text-text-tertiary font-bold capitalize">{staff.department} • {staff.tasksCompleted} Tasks</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                        <span className="text-sm font-bold text-text-primary">{staff.rating}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-text-tertiary italic py-4">No staff data available yet.</p>
                            )}
                        </div>
                    </Card>

                    {/* Recent Guest Feedback */}
                    <Card className="p-6 border-white/[0.05] bg-surface">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-text-primary">Recent Guest Feedback</h3>
                            <button className="text-xs font-bold text-primary hover:brightness-125 transition-all uppercase tracking-widest">View All</button>
                        </div>
                        <div className="space-y-5">
                            {data.feedback?.length > 0 ? data.feedback.map((fb: any, i: number) => (
                                <div key={i} className="space-y-2.5 pb-5 border-b border-white/[0.04] last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <Star key={s} className={`w-3.5 h-3.5 ${s < fb.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-700'}`} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{formatTimeAgo(fb.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{fb.comment}&rdquo;</p>
                                    <p className="text-[11px] font-bold text-text-tertiary">
                                        - {fb.guestName}, Room {fb.room}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm text-text-tertiary italic py-4">No guest feedback available yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
