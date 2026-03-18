'use client'

import { useState, useEffect } from 'react'
import {
    Megaphone, Plus, Download, ChevronDown,
    Mail, MessageSquare, Bell, Edit2, Trash2,
    TrendingUp, Users, Target, DollarSign,
    MoreHorizontal, Send, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildContextUrl as bcu } from '@/lib/admin-context'

export default function MarketingPage() {
    const [channel, setChannel] = useState('EMAIL')
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [form, setForm] = useState({
        segment: 'Diamond Members Only',
        promoCode: ''
    })

    const fetchMarketingData = async () => {
        try {
            const res = await fetch(bcu('/api/admin/marketing'))
            if (res.ok) {
                const data = await res.json()
                setCampaigns(data.campaigns)
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Error fetching marketing data:', error)
            toast.error('Failed to load marketing data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMarketingData()
    }, [])

    const handleSendPromotion = async () => {
        setSending(true)
        try {
            const res = await fetch('/api/admin/marketing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Quick ${channel} Promotion`,
                    segment: form.segment,
                    channel: channel,
                    promoCode: form.promoCode
                })
            })

            if (res.ok) {
                toast.success('Promotion sent successfully!', {
                    description: `Blast sent to ${form.segment} via ${channel}`
                })
                fetchMarketingData()
                setForm({ ...form, promoCode: '' })
            } else {
                toast.error('Failed to send promotion')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans p-8">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Marketing & Promotions</h1>
                        <p className="text-gray-500 font-medium">Targeting VIP segments and high-value loyalty tiers</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border border-white/5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                            <Download className="w-4 h-4 text-gray-500" /> Export Report
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
                            <Plus className="w-4 h-4" /> Create Campaign
                        </button>
                    </div>
                </div>

                {/* ── TOP STATS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Campaigns', value: stats?.activeCampaigns || '0', trend: '+2.4%', icon: Megaphone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'VIP Segment Size', value: stats?.vipSegmentSize || '0', trend: '+5.1%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Conversion Rate (VIP)', value: stats?.conversionRate || '0%', trend: '+1.2%', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Marketing Revenue', value: stats?.marketingRevenue || '$0', trend: '+15.8%', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#161b22] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                            </div>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-bold text-white tracking-tight leading-none">{stat.value}</p>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MIDDLE SECTION ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* VIP Performance Chart */}
                    <div className="lg:col-span-8 bg-[#161b22] border border-white/5 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-white">VIP Performance by Tier</h3>
                                <p className="text-xs text-gray-500 font-medium">Revenue contribution per loyalty segment</p>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Last 30 Days <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="h-64 flex items-end justify-around gap-8 px-4">
                            {(stats?.tierPerformance || [
                                { label: 'Diamond', height: '0%', color: 'bg-blue-600' },
                                { label: 'Platinum', height: '0%', color: 'bg-blue-600/80' },
                                { label: 'Gold', height: '0%', color: 'bg-blue-600/60' },
                            ]).map((tier: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group max-w-[120px]">
                                    <div className="w-full relative h-48 flex items-end">
                                        <div
                                            className={cn("w-full rounded-md transition-all group-hover:brightness-110 shadow-lg shadow-blue-600/10", tier.color)}
                                            style={{ height: tier.height }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{tier.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick VIP Target Form */}
                    <div className="lg:col-span-4 bg-[#161b22] border border-white/5 rounded-xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-white mb-1">Quick VIP Target</h3>
                        <p className="text-xs text-gray-500 font-medium mb-8">Launch a micro-campaign instantly</p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Target Segment</label>
                                <div className="relative">
                                    <select
                                        value={form.segment}
                                        onChange={(e) => setForm({ ...form, segment: e.target.value })}
                                        className="w-full bg-[#0d1117] border border-white/5 rounded-lg px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50 transition-all font-bold"
                                    >
                                        <option>Diamond Members Only</option>
                                        <option>Platinum & Above</option>
                                        <option>All VIP Tiers</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Channel</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'EMAIL', icon: Mail, label: 'EMAIL' },
                                        { id: 'WHATSAPP', icon: MessageSquare, label: 'WHATSAPP' },
                                        { id: 'PUSH', icon: Bell, label: 'PUSH' },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setChannel(c.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                                                channel === c.id
                                                    ? "bg-blue-600/10 border-blue-600 text-blue-500"
                                                    : "bg-[#0d1117] border-white/5 text-gray-500 hover:border-white/10"
                                            )}
                                        >
                                            <c.icon className="w-5 h-5" />
                                            <span className="text-[8px] font-black tracking-widest">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Promo Code</label>
                                <input
                                    placeholder="e.g. DIAMOND25"
                                    value={form.promoCode}
                                    onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
                                    className="w-full bg-[#0d1117] border border-white/5 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold"
                                />
                            </div>

                            <button
                                onClick={handleSendPromotion}
                                disabled={sending}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-600/10 transition-all flex items-center justify-center gap-2 group"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Promotion'}
                                {!sending && <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CAMPAIGNS TABLE ── */}
                <div className="bg-[#161b22] border border-white/5 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">Active & Scheduled VIP Promotions</h3>
                        </div>
                        <button className="text-xs font-bold text-blue-500 hover:text-white transition-colors">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#0d1117] text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Campaign Name</th>
                                    <th className="px-8 py-5">Target Segment</th>
                                    <th className="px-8 py-5">Performance</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {campaigns.map((campaign, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-white mb-0.5">{campaign.name}</p>
                                            <p className="text-[10px] text-gray-600 font-medium">{campaign.started}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[9px] font-black rounded-md uppercase tracking-widest border border-cyan-500/20">
                                                {campaign.segment}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 min-w-[200px]">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 transition-all duration-1000"
                                                        style={{ width: `${campaign.performance}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-bold text-white">{campaign.performance || '0'}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    campaign.status === 'ACTIVE' ? "bg-green-500" :
                                                        campaign.status === 'SCHEDULED' ? "bg-amber-500" : "bg-gray-500"
                                                )} />
                                                <span className="text-xs font-bold text-gray-300">{campaign.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-gray-500 hover:text-white transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {campaigns.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-500 italic">
                                            No campaigns found. Start by sending a quick promotion!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
