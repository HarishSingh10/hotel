'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Calendar, Download, TrendingUp, Users, Clock, ArrowDownRight, MoreHorizontal, Star, AlertCircle, Search, Check, X, BarChart3, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildContextUrl } from '@/lib/admin-context'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

const PIE_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function RestaurantAnalysisPage() {
    const [timeRange, setTimeRange] = useState('Current Month')
    const [activeTab, setActiveTab] = useState('All Day')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingValue, setEditingValue] = useState('')
    const [exporting, setExporting] = useState(false)

    const rangeMap: Record<string, string> = {
        'Current Month': 'month',
        'Last Month': 'lastMonth',
        '90 Days': 'quarter',
        'This Year': 'year',
    }

    const apiUrl = buildContextUrl(`/api/admin/analytics/restaurant`, {
        tab: activeTab,
        range: rangeMap[timeRange],
    })

    const { data: raw, error, isLoading, mutate: revalidate } = useSWR(apiUrl, fetcher)
    const analysisData = raw?.data ?? raw

    const handleExportPDF = async () => {
        if (!analysisData) return
        setExporting(true)
        try {
            const jsPDF = (await import('jspdf')).default
            const autoTable = (await import('jspdf-autotable')).default
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

            const { stats, topSelling, poorPerforming, matrix, categories } = analysisData

            // Header
            doc.setFillColor(22, 27, 34)
            doc.rect(0, 0, 210, 30, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('Restaurant Sales & Menu Analysis', 14, 14)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text(`${activeTab} • ${timeRange} • Generated ${new Date().toLocaleDateString('en-IN')}`, 14, 22)

            // KPI Stats
            let y = 40
            doc.setTextColor(33, 33, 33)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('Key Performance Indicators', 14, y)
            y += 6

            autoTable(doc, {
                startY: y,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Revenue', formatCurrency(stats.totalRevenue)],
                    ['Average Check Size', formatCurrency(stats.avgCheck)],
                    ['Total Covers', stats.totalCovers.toString()],
                    ['Peak Hours', stats.peakHours],
                ],
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] },
                styles: { fontSize: 9 },
            })

            // Top Selling
            y = (doc as any).lastAutoTable.finalY + 10
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('Top Selling Items', 14, y)
            y += 4

            autoTable(doc, {
                startY: y,
                head: [['Item', 'Units Sold', 'Popularity']],
                body: topSelling.map((i: any) => [i.name, i.units.toString(), `${i.progress}%`]),
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] },
                styles: { fontSize: 9 },
            })

            // Revenue by Category
            y = (doc as any).lastAutoTable.finalY + 10
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text('Revenue by Category', 14, y)
            y += 4

            autoTable(doc, {
                startY: y,
                head: [['Category', 'Revenue Share']],
                body: categories.map((c: any) => [c.label, `${c.value}%`]),
                theme: 'striped',
                headStyles: { fillColor: [34, 197, 94] },
                styles: { fontSize: 9 },
            })

            // Menu Matrix
            doc.addPage()
            y = 20
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.text('Menu Popularity Matrix', 14, y)
            y += 8

            const matrixSections = [
                { title: '⭐ Stars (High Profit, High Popularity)', items: matrix.stars, color: [37, 99, 235] as [number, number, number] },
                { title: '🐎 Plowhorses (Low Profit, High Popularity)', items: matrix.plowhorses, color: [107, 114, 128] as [number, number, number] },
                { title: '🔍 Puzzles (High Profit, Low Popularity)', items: matrix.puzzles, color: [245, 158, 11] as [number, number, number] },
                { title: '🐕 Dogs (Low Profit, Low Popularity)', items: matrix.dogs, color: [239, 68, 68] as [number, number, number] },
            ]

            for (const section of matrixSections) {
                if (section.items.length === 0) continue
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(section.color[0], section.color[1], section.color[2])
                doc.text(section.title, 14, y)
                y += 4
                doc.setTextColor(33, 33, 33)

                autoTable(doc, {
                    startY: y,
                    head: [['Item', 'Units', 'Margin']],
                    body: section.items.map((i: any) => [i.name, i.units.toString(), formatCurrency(i.margin)]),
                    theme: 'grid',
                    headStyles: { fillColor: section.color },
                    styles: { fontSize: 8 },
                    margin: { left: 14, right: 14 },
                })
                y = (doc as any).lastAutoTable.finalY + 8
            }

            // Poor Performing
            if (poorPerforming.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(33, 33, 33)
                doc.text('Poor Performing Items', 14, y)
                y += 4

                autoTable(doc, {
                    startY: y,
                    head: [['Item', 'Category', 'Sales', 'Sentiment', 'Status']],
                    body: poorPerforming.map((i: any) => [
                        i.name, i.category, i.sales.toString(),
                        `${(i.sentiment || 0).toFixed(1)}/5`, i.status
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [239, 68, 68] },
                    styles: { fontSize: 8 },
                })
            }

            doc.save(`Restaurant_Analysis_${timeRange.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
            toast.success('PDF exported successfully')
        } catch (err) {
            console.error(err)
            toast.error('Export failed')
        } finally {
            setExporting(false)
        }
    }

    const handleUpdateMargin = async (itemId: string, newMargin: number) => {
        try {
            const res = await fetch('/api/admin/content/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId, margin: newMargin }),
            })
            if (res.ok) {
                toast.success('Margin updated')
                setEditingId(null)
                revalidate()
            } else toast.error('Failed to update margin')
        } catch { toast.error('Error') }
    }

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )

    if (!analysisData || analysisData.error) return (
        <div className="flex items-center justify-center min-h-[400px] text-text-secondary text-sm">
            Failed to load restaurant analytics. Make sure you have menu items added.
        </div>
    )

    const { stats, topSelling, poorPerforming, matrix, categories } = analysisData

    // Build bar chart data from topSelling
    const barData = topSelling.map((i: any) => ({ name: i.name.length > 12 ? i.name.slice(0, 12) + '…' : i.name, units: i.units }))

    // Build pie data from categories
    const pieData = categories.map((c: any) => ({ name: c.label, value: c.value }))

    const MatrixCard = ({ title, items, color, badge }: { title: string; items: any[]; color: string; badge: string }) => (
        <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
                <h4 className={cn('text-base font-bold', color)}>{title}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-light text-text-tertiary border border-border uppercase tracking-wider">{badge}</span>
            </div>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-xs text-text-tertiary py-4 text-center">No items in this category</p>
                ) : items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-surface-light rounded-xl border border-border group">
                        <div>
                            <p className="text-sm font-semibold text-white">{item.name}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">{item.units} units sold</p>
                        </div>
                        <div className="text-right">
                            {editingId === item.id ? (
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        value={editingValue}
                                        onChange={e => setEditingValue(e.target.value)}
                                        className="w-20 bg-surface border border-primary rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdateMargin(item.id, parseFloat(editingValue))} className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400">
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs font-bold text-emerald-400">{formatCurrency(item.margin)} margin</p>
                                    <button
                                        onClick={() => { setEditingId(item.id); setEditingValue(item.margin.toString()) }}
                                        className="text-[10px] text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Edit margin
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Restaurant Sales & Menu Popularity</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Detailed analytics on restaurant performance and menu item optimization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-surface-light border border-border rounded-xl p-1 gap-1">
                        {Object.keys(rangeMap).map(r => (
                            <button key={r} onClick={() => setTimeRange(r)}
                                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                    timeRange === r ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
                                )}>
                                {r}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Meal Tabs */}
            <div className="flex bg-surface-light border border-border rounded-xl p-1 w-fit gap-1">
                {['All Day', 'Breakfast', 'Lunch', 'Dinner'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all',
                            activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'
                        )}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Avg. Check Size', value: formatCurrency(stats.avgCheck), icon: UtensilsCrossed, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Total Covers', value: stats.totalCovers.toLocaleString(), icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Busy Hour Peak', value: stats.peakHours, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((s, i) => (
                    <div key={i} className="bg-surface border border-border rounded-2xl p-5">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                            <s.icon className={cn('w-4.5 h-4.5', s.color)} />
                        </div>
                        <p className="text-xs text-text-secondary mb-1">{s.label}</p>
                        <p className="text-xl font-bold text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Selling Bar Chart */}
                <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6">
                    <h3 className="text-base font-semibold text-white mb-5">Top Selling Items</h3>
                    {barData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-text-tertiary text-sm">
                            No food orders recorded yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ background: '#161b22', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                                    formatter={(v: any) => [`${v} units`, 'Sold']}
                                />
                                <Bar dataKey="units" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Revenue by Category Pie Chart */}
                <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 flex flex-col">
                    <h3 className="text-base font-semibold text-white mb-5">Revenue by Category</h3>
                    {pieData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                            No category data yet
                        </div>
                    ) : (
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((_: any, i: number) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#161b22', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                                        formatter={(v: any) => [`${v}%`, 'Share']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {categories.map((c: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-text-secondary">{c.label}</span>
                                        </div>
                                        <span className="font-semibold text-white">{c.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Popularity Matrix */}
            <div>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Menu Popularity Matrix</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Classification based on profitability vs. popularity. Click &quot;Edit margin&quot; to adjust.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MatrixCard title="⭐ Stars" items={matrix.stars} color="text-blue-400" badge="High Profit · High Popularity" />
                    <MatrixCard title="🐎 Plowhorses" items={matrix.plowhorses} color="text-slate-400" badge="Low Profit · High Popularity" />
                    <MatrixCard title="🔍 Puzzles" items={matrix.puzzles} color="text-amber-400" badge="High Profit · Low Popularity" />
                    <MatrixCard title="🐕 Dogs" items={matrix.dogs} color="text-red-400" badge="Low Profit · Low Popularity" />
                </div>
            </div>

            {/* Poor Performing Items */}
            {poorPerforming.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-border">
                        <h3 className="text-base font-semibold text-white">Poor Performing Items</h3>
                        <p className="text-xs text-text-secondary mt-0.5">Items with low sales or poor guest ratings — consider removing or improving.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-surface-light">
                                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Item</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Category</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Sales</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Rating</th>
                                    <th className="px-5 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {poorPerforming.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-surface-light transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-white">{item.name}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-secondary">{item.category}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-white">
                                                {item.sales}
                                                {item.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-surface-light rounded-full overflow-hidden">
                                                    <div
                                                        className={cn('h-full rounded-full', item.sentiment < 2.5 ? 'bg-red-500' : 'bg-amber-500')}
                                                        style={{ width: `${(item.sentiment / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-text-secondary">{(item.sentiment || 0).toFixed(1)}/5</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={cn(
                                                'text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider',
                                                item.status === 'REVIEW REQ.'
                                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
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
            )}
        </div>
    )
}
