'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
    Users, TrendingUp, DollarSign, Award, Download,
    Calendar, Filter, Search, ChevronDown, User,
    Mail, Phone, Clock, ArrowRight, MoreHorizontal,
    ShieldCheck, CreditCard, Star, PieChart
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { buildContextUrl } from '@/lib/admin-context'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoyaltyAnalysisPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [timeRange, setTimeRange] = useState('Last 12 Months')

    const { data: loyaltyData, error, isLoading } = useSWR(
        ['/api/admin/analytics/loyalty', session?.user?.role],
        ([url]) => fetch(buildContextUrl(url)).then(res => res.json())
    )

    useEffect(() => {
        if (session && !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
            router.push('/admin/dashboard')
        }
    }, [session, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!loyaltyData || loyaltyData.error) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-gray-400">
                Failed to load loyalty analytics data.
            </div>
        )
    }

    const { stats, topGuests, chartData } = loyaltyData

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans p-8">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Guest Loyalty & Retention</h1>
                        <p className="text-gray-500 font-medium">Insights into repeat visitor behavior and total lifetime value.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border border-gray-800 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                            <Calendar className="w-4 h-4 text-gray-500" /> {timeRange}
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98]">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                </div>

                {/* ── TOP STATS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Repeat Guest %', value: `${stats.repeatRate}%`, trend: `${stats.repeatGuestCount} total`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Loyalty Revenue', value: formatCurrency(stats.loyaltyRevenue), trend: `${stats.loyaltyRevenuePercent}% of total`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
                        { label: 'Avg. Lifetime Value', value: formatCurrency(stats.avgLTV), trend: '+5.2% per guest', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'Total Guests', value: stats.totalGuests.toLocaleString(), trend: 'Active profiles', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm group hover:border-gray-700 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{stat.trend}</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-white tracking-tight italic leading-none">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── VISITOR ANALYTICS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visitor Graph Placeholder */}
                    <div className="lg:col-span-8 bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xl font-bold text-white">First-time vs. Repeat Visitors</h3>
                            <div className="flex bg-[#0d1117] p-1 rounded-lg border border-gray-800">
                                <button className="px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white shadow-sm">Monthly</button>
                                <button className="px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors">Weekly</button>
                            </div>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-4 px-2">
                            {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="w-full flex flex-col-reverse gap-1.5 h-48">
                                        <div
                                            className="w-full bg-blue-600/40 rounded-t-sm group-hover:bg-blue-600/60 transition-all"
                                            style={{ height: `${Math.random() * 40 + 20}%` }}
                                        />
                                        <div
                                            className="w-full bg-[#233648]/40 rounded-t-sm group-hover:bg-[#233648]/60 transition-all"
                                            style={{ height: `${Math.random() * 30 + 10}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase">{month}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-8 mt-10 ml-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Repeat Visitors</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#233648]" />
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">First-time Visitors</span>
                            </div>
                        </div>
                    </div>

                    {/* Booking Source Doughnut */}
                    <div className="lg:col-span-4 bg-[#161b22] p-8 border border-gray-800 rounded-xl flex flex-col shadow-sm">
                        <h3 className="text-xl font-bold text-white mb-2">Booking Source</h3>
                        <p className="text-xs text-gray-500 font-medium mb-10 tracking-tight">By Loyalty Segments</p>

                        <div className="relative flex-1 flex items-center justify-center">
                            <div className="relative w-44 h-44 rounded-full border-[14px] border-[#0d1117] flex items-center justify-center shadow-lg">
                                {/* Segment Sim */}
                                <div className="absolute inset-[-14px] rounded-full border-[14px] border-blue-600" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)' }} />
                                <div className="absolute inset-[-14px] rounded-full border-[14px] border-[#233648]" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0, 100% 36%)' }} />

                                <div className="text-center">
                                    <p className="text-3xl font-black text-white leading-none">64%</p>
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Direct</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mt-auto pt-10">
                            {[
                                { label: 'Direct Booking', value: '84%', color: 'bg-blue-600' },
                                { label: 'OTA (Booking/Expedia)', value: '22%', color: 'bg-[#233648]' },
                                { label: 'Corporate', value: '14%', color: 'bg-gray-800' },
                            ].map((source, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 whitespace-nowrap">
                                        <div className={cn("w-2 h-2 rounded-full", source.color)} />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{source.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{source.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── TOP LOYAL GUESTS TABLE ── */}
                <div className="bg-[#161b22] border border-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Top Loyal Guests</h3>
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">High Lifetime Value Identification</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                placeholder="Filter by name..."
                                className="w-full bg-[#0d1117] border border-gray-800 rounded-lg pl-12 pr-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-700 outline-none focus:border-blue-500/50 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#0d1117] text-[11px] font-bold text-gray-600 uppercase tracking-[0.25em]">
                                    <th className="px-8 py-5">Guest Name</th>
                                    <th className="px-8 py-5">Total Stays</th>
                                    <th className="px-8 py-5">Total Spent</th>
                                    <th className="px-8 py-5 text-center">Last Visit</th>
                                    <th className="px-8 py-5">Loyalty Tier</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {topGuests.map((guest: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/5 overflow-hidden">
                                                    <User className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white mb-0.5 whitespace-nowrap">{guest.name}</p>
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{guest.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-300">{guest.stays} stays</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="text-sm font-bold text-white tracking-tight">{formatCurrency(guest.spent)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center whitespace-nowrap">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{new Date(guest.lastVisit).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className={cn(
                                                "w-fit px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.3em] border",
                                                guest.bg, guest.border, guest.color
                                            )}>
                                                {guest.tier}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 border border-transparent hover:border-gray-800 hover:bg-gray-800 rounded-lg text-gray-600 hover:text-white transition-all">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
