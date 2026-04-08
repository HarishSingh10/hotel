'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
    Calendar, Download, TrendingUp, Users, Clock,
    ArrowUpRight, ArrowDownRight, Filter, ChevronDown,
    PieChart, BarChart3, UtensilsCrossed, Star,
    AlertCircle, Search, MoreHorizontal, Check, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { mutate } from 'swr'

export default function RestaurantAnalysisPage() {
    const [timeRange, setTimeRange] = useState('Current Month')
    const [activeTab, setActiveTab] = useState('All Day')

    const rangeMap: Record<string, string> = {
        'Current Month': 'month',
        'Last Month': 'lastMonth',
        '90 Days': 'quarter',
        'This Year': 'year'
    }

    const { data: analysisData, error, isLoading, mutate: revalidate } = useSWR(`/api/admin/analytics/restaurant?tab=${activeTab}&range=${rangeMap[timeRange]}`, 
        (url: string) => fetch(url).then(res => res.json())
    )

    const handleTimeToggle = () => {
        const ranges = Object.keys(rangeMap)
        const idx = ranges.indexOf(timeRange)
        const next = ranges[(idx + 1) % ranges.length]
        setTimeRange(next)
    }

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingValue, setEditingValue] = useState('')

    const handleExportPDF = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!analysisData || analysisData.error) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-gray-400">
                Failed to load restaurant analytics data.
            </div>
        )
    }

    const { stats, topSelling, poorPerforming, matrix, categories } = analysisData

    const handleUpdateMargin = async (itemId: string, newMargin: number) => {
        try {
            const res = await fetch('/api/admin/content/menu', {
                method: 'POST', // The route handles both create and update
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId, margin: newMargin })
            })
            if (res.ok) {
                toast.success('Margin optimized!')
                setEditingId(null)
                mutate('/api/admin/analytics/restaurant')
            }
        } catch (error) {
            toast.error('Failed to update margin')
        }
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans p-8 print:p-0 print:bg-white print:text-black">
            <style jsx global>{`
                @media print {
                    body { background: white !important; color: black !important; }
                    .bg-[#161b22] { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
                    .text-white { color: black !important; }
                    .text-gray-300 { color: #374151 !important; }
                    .border-gray-800 { border-color: #e5e7eb !important; }
                    button { display: none !important; }
                    .print-header { display: block !important; }
                    .shadow-sm { shadow: none !important; }
                }
            `}</style>

            <div className="max-w-[1600px] mx-auto space-y-10">
                
                {/* Print Only Header */}
                <div className="hidden print:block mb-10 border-b-2 border-black pb-4 text-center">
                    <h1 className="text-4xl font-black uppercase">Restaurant Performance Report</h1>
                    <p className="text-sm font-bold mt-2">{new Date().toLocaleDateString()} • {activeTab} Performance</p>
                </div>

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Restaurant Sales & Menu Popularity</h1>
                        <p className="text-gray-500 font-medium">Detailed analytics on restaurant performance and menu item optimization.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleTimeToggle}
                            className="flex items-center gap-3 px-5 py-2.5 bg-[#161b22] border border-gray-800 rounded-lg text-sm font-semibold hover:border-blue-500/50 hover:bg-[#1c2128] transition-all group active:scale-95"
                        >
                            <Calendar className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" /> 
                            <span className="text-gray-300">{timeRange}</span>
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] print:hidden"
                        >
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                    </div>
                </div>

                {/* ── TABS ── */}
                <div className="flex bg-[#161b22] p-1 rounded-lg border border-gray-800 w-fit print:hidden">
                    {['All Day', 'Breakfast', 'Lunch', 'Dinner'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === tab
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── QUICK STATS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), trend: '+12.5%', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Avg. Check Size', value: formatCurrency(stats.avgCheck), trend: '+4.2%', icon: UtensilsCrossed, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'Total Covers', value: stats.totalCovers.toLocaleString(), trend: 'Stable', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Busy Hour Peak', value: stats.peakHours, trend: 'Fri & Sat', icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm group hover:border-gray-700 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                    stat.trend.includes('+') ? "bg-green-500/10 text-green-500" : "bg-gray-800 text-gray-500"
                                )}>
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── MAIN CHARTS SECTION ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Top Selling Items */}
                    <div className="lg:col-span-7 bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white">Top 10 Selling Items</h3>
                            <button className="text-gray-600 hover:text-white transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            {topSelling.map((item: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-300">{item.name}</span>
                                        <span className="text-gray-500 font-mono ">{item.units} units</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[#0d1117] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-10 py-3 text-xs font-bold text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                            View All 10 Items
                        </button>
                    </div>

                    {/* Revenue by Category (Pie Chart Simulation) */}
                    <div className="lg:col-span-5 bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-8">Revenue by Category</h3>
                        <div className="relative flex-1 flex items-center justify-center p-10">
                            <div className="relative w-48 h-48 rounded-full border-[16px] border-[#0d1117] flex items-center justify-center shadow-inner">
                                {/* Simulated Doughnut Segments */}
                                {categories.map((cat: any, i: number) => (
                                    <div 
                                        key={i}
                                        className="absolute inset-[-16px] rounded-full border-[16px]" 
                                        style={{ 
                                            borderColor: i === 0 ? '#2563eb' : i === 1 ? '#22c55e' : '#f59e0b',
                                            clipPath: `polygon(50% 50%, ${i === 0 ? '100% 0, 100% 100%, 0 100%, 0 0' : i === 1 ? '0 0, 100% 0, 100% 24%' : '100% 24%, 100% 38%'})`
                                        }} 
                                    />
                                ))}

                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Total</p>
                                    <p className="text-2xl font-bold text-white leading-none">{formatCurrency(stats.totalRevenue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mt-auto">
                            {categories.map((cat: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", i === 0 ? 'bg-blue-600' : i === 1 ? 'bg-green-500' : 'bg-amber-500')} />
                                        <span className="text-sm font-medium text-gray-400">{cat.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{cat.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── MENU POPULARITY MATRIX ── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">Menu Popularity Matrix</h3>
                            <p className="text-xs text-gray-500 font-medium">Classification based on profitability vs. popularity</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-gray-700 cursor-help hover:text-gray-500 transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Stars */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm relative group overflow-hidden">
                            <Star className="absolute top-[-20px] right-[-20px] w-32 h-32 text-gray-800/10 group-hover:text-amber-500/5 transition-all duration-500" />
                            <div className="flex items-center gap-4 mb-8">
                                <h4 className="text-blue-500  font-bold text-xl flex items-center gap-3">
                                    <Star className="w-5 h-5 fill-blue-500" /> Stars
                                </h4>
                                <span className="bg-blue-500/10 text-blue-500 text-[9px] font-bold px-3 py-1 rounded uppercase tracking-widest">High Profit • High Popularity</span>
                            </div>
                            <div className="space-y-4">
                                {matrix.stars.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 bg-[#0d1117] rounded-lg border border-gray-800 group/item">
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-gray-600 font-mono italic">Vol: {item.units} units</p>
                                        </div>
                                        <div className="text-right">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className="w-20 bg-[#161b22] border border-blue-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateMargin(item.id, parseFloat(editingValue))} className="p-1 hover:bg-green-500/20 rounded text-green-500">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-500/20 rounded text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-bold text-green-500">{formatCurrency(item.margin)} Margin</p>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(item.id)
                                                            setEditingValue(item.margin.toString())
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-opacity"
                                                    >
                                                        Adjust
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {matrix.stars.length === 0 && <p className="text-xs text-gray-600 italic">No items in this quadrant yet.</p>}
                            </div>
                        </div>

                        {/* Plowhorses */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm group">
                            <div className="flex items-center gap-4 mb-8">
                                <h4 className="text-gray-400  font-bold text-xl flex items-center gap-3">
                                    <Clock className="w-5 h-5" /> Plowhorses
                                </h4>
                                <span className="bg-gray-800 text-gray-500 text-[9px] font-bold px-3 py-1 rounded uppercase tracking-widest">Low Profit • High Popularity</span>
                            </div>
                            <div className="space-y-4">
                                {matrix.plowhorses.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 bg-[#0d1117] rounded-lg border border-gray-800 group/item">
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-gray-600 font-mono italic">Vol: {item.units} units</p>
                                        </div>
                                        <div className="text-right">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className="w-20 bg-[#161b22] border border-blue-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateMargin(item.id, parseFloat(editingValue))} className="p-1 hover:bg-green-500/20 rounded text-green-500">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-500/20 rounded text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-bold text-amber-500">{formatCurrency(item.margin)} Margin</p>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(item.id)
                                                            setEditingValue(item.margin.toString())
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-opacity"
                                                    >
                                                        Adjust
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {matrix.plowhorses.length === 0 && <p className="text-xs text-gray-600 italic">No items in this quadrant yet.</p>}
                            </div>
                        </div>

                        {/* Puzzles */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm group">
                            <div className="flex items-center gap-4 mb-8">
                                <h4 className="text-gray-400  font-bold text-xl flex items-center gap-3">
                                    <Search className="w-5 h-5" /> Puzzles
                                </h4>
                                <span className="bg-gray-800 text-gray-500 text-[9px] font-bold px-3 py-1 rounded uppercase tracking-widest">High Profit • Low Popularity</span>
                            </div>
                            <div className="space-y-4">
                                {matrix.puzzles.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 bg-[#0d1117] rounded-lg border border-gray-800 group/item">
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-gray-600 font-mono italic">Vol: {item.units} units</p>
                                        </div>
                                        <div className="text-right">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className="w-20 bg-[#161b22] border border-blue-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateMargin(item.id, parseFloat(editingValue))} className="p-1 hover:bg-green-500/20 rounded text-green-500">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-500/20 rounded text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-bold text-blue-500">{formatCurrency(item.margin)} Margin</p>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(item.id)
                                                            setEditingValue(item.margin.toString())
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-opacity"
                                                    >
                                                        Adjust
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {matrix.puzzles.length === 0 && <p className="text-xs text-gray-600 italic">No items in this quadrant yet.</p>}
                            </div>
                        </div>

                        {/* Dogs */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm group border-red-900/10">
                            <div className="flex items-center gap-4 mb-8">
                                <h4 className="text-red-500  font-bold text-xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" /> Dogs
                                </h4>
                                <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-3 py-1 rounded uppercase tracking-widest">Low Profit • Low Popularity</span>
                            </div>
                            <div className="space-y-4">
                                {matrix.dogs.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 bg-[#0d1117] rounded-lg border border-gray-800 group/item">
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-gray-600 font-mono italic">Vol: {item.units} units</p>
                                        </div>
                                        <div className="text-right">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className="w-20 bg-[#161b22] border border-blue-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdateMargin(item.id, parseFloat(editingValue))} className="p-1 hover:bg-green-500/20 rounded text-green-500">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-500/20 rounded text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-bold text-red-500">{formatCurrency(item.margin)} Margin</p>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(item.id)
                                                            setEditingValue(item.margin.toString())
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-opacity"
                                                    >
                                                        Adjust
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {matrix.dogs.length === 0 && <p className="text-xs text-gray-600 italic">No items in this quadrant yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── POOR PERFORMING ITEMS & SENTIMENT ── */}
                <div className="bg-[#161b22] border border-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-800">
                        <h3 className="text-xl font-bold text-white">Poor Performing Items & Sentiment</h3>
                        <p className="text-xs text-gray-500 font-medium">Identify items for menu removal or recipe optimization.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#0d1117] text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    <th className="px-8 py-5">Item Name</th>
                                    <th className="px-8 py-5">Category</th>
                                    <th className="px-8 py-5">Sales Volume</th>
                                    <th className="px-8 py-5">Guest Sentiment</th>
                                    <th className="px-8 py-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {poorPerforming.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-white mb-0.5">{item.name}</p>
                                            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">ID: {item.id}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-medium text-gray-400">{item.category}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{item.sales}</span>
                                                {item.trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> : <TrendingUp className="w-3.5 h-3.5 text-gray-600" />}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            item.sentiment < 2.5 ? "bg-red-500" : "bg-amber-500"
                                                        )}
                                                        style={{ width: `${(item.sentiment / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                                    {item.sentiment < 2 ? 'Very Poor' : item.sentiment < 3 ? 'Poor' : 'Mediocre'} ({(item.sentiment || 0).toFixed(1)})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={cn(
                                                "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                                                item.status === 'REVIEW REQ.' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                            )}>
                                                {item.status}
                                            </span>
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
