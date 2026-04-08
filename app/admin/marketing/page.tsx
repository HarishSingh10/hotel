'use client'

import { useState, useEffect } from 'react'
import {
    Megaphone, Plus, Download, ChevronDown,
    Mail, MessageSquare, Bell, TrendingUp, Users, Target, IndianRupee,
    Rocket, ArrowUpRight, Star, Loader2, Send, Building2, CheckCircle2,
    Calendar, History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildContextUrl as bcu } from '@/lib/admin-context'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function MarketingPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [channel, setChannel] = useState('EMAIL')
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [guestList, setGuestList] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [segment, setSegment] = useState('Diamond Member Only')
    const [promoCode, setPromoCode] = useState('ZENVIP20')
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const fetchMarketingData = async () => {
        try {
            const res = await fetch(bcu('/api/admin/marketing'))
            if (res.ok) {
                const data = await res.json()
                setCampaigns(data.campaigns || [])
                setGuestList(data.guestList || [])
                setStats(data.stats)
            }
        } catch (error) {
            toast.error('Failed to load marketing analytics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session && !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'].includes(session.user.role)) {
            router.push('/admin/dashboard')
            return
        }
        fetchMarketingData()
    }, [session, router])

    const filteredGuests = guestList.filter(g => {
        if (segment.includes('Diamond')) return g.stays >= 5
        if (segment.includes('Platinum')) return g.stays >= 3
        if (segment.includes('Gold')) return g.stays >= 1
        return true
    })

    const handleSendBlast = async () => {
        if (filteredGuests.length === 0) return toast.error('No guests in selected segment')
        setSending(true)
        try {
            const res = await fetch('/api/admin/marketing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'BLAST',
                    name: `Blast - ${segment}`,
                    segment,
                    channel,
                    promoCode
                })
            })
            if (res.ok) {
                toast.success('Campaign Dispatched Successfully')
                fetchMarketingData()
            }
        } catch { toast.error('System error during dispatch') }
        finally { setSending(false) }
    }

    const handleExport = () => {
        if (filteredGuests.length === 0) return toast.error('No data to export')
        const headers = ['Name', 'Email', 'Phone', 'Stays']
        const csv = [headers.join(','), ...filteredGuests.map(g => [g.name, g.email, g.phone, g.stays].join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `guests_${segment.toLowerCase().replace(/ /g, '_')}.csv`
        a.click()
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    )

    return (
        <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Marketing Analytics</h1>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Outreach & Visibility Management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> EXPORT
                    </button>
                    <button className="px-5 py-2.5 bg-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> CAMPAIGN
                    </button>
                </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active', value: stats?.activeCampaigns || 0, trend: '+2.4%', icon: Rocket },
                    { label: 'VIP Reach', value: stats?.vipSegmentSize || 0, trend: '+5.1%', icon: Star },
                    { label: 'Conv Rate', value: stats?.conversionRate || '0%', trend: '+1.2%', icon: Target },
                    { label: 'Revenue', value: stats?.marketingRevenue ? `₹${stats.marketingRevenue.toLocaleString()}` : '₹0', trend: '+15.8%', icon: IndianRupee },
                ].map((s, i) => (
                    <div key={i} className="bg-[#111827] border border-white/[0.06] p-6 rounded-2xl shadow-sm relative group overflow-hidden">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{s.label}</p>
                        <div className="flex items-end justify-between relative z-10">
                            <h2 className="text-3xl font-bold text-white">{s.value}</h2>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                                {s.trend} <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>
                        <s.icon className="absolute -right-2 -bottom-2 w-16 h-16 opacity-[0.03] text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                ))}
            </div>

            {/* --- MIDDLE SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Instant Blast Module */}
                <div className="lg:col-span-1 bg-[#111827] border border-white/[0.06] p-8 rounded-[2rem] space-y-8 shadow-sm h-fit">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 rounded-xl">
                            <Send className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Instant Blast</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Notification Chain</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Segment</label>
                             <div className="relative">
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-full bg-black/30 border border-white/5 rounded-xl px-5 py-3.5 text-xs font-bold text-white flex items-center justify-between hover:border-white/10 transition-all uppercase tracking-tight"
                                >
                                    {segment}
                                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", dropdownOpen && "rotate-180")} />
                                </button>
                                
                                {dropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        {['Diamond Member Only', 'Platinum & Above', 'Gold & Above', 'All Past Guests'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setSegment(opt)
                                                    setDropdownOpen(false)
                                                }}
                                                className="w-full px-5 py-3 text-left text-xs font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-colors border-b border-white/5 last:border-0 uppercase tracking-tight"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Promo Bundle</label>
                             <input 
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value)}
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-3.5 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all"
                                placeholder="SAVE20OFF"
                             />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'EMAIL', icon: Mail, label: 'Email' },
                                { id: 'WHATSAPP', icon: MessageSquare, label: 'WhatsApp' },
                                { id: 'PUSH', icon: Bell, label: 'Push' },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setChannel(t.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                        channel === t.id 
                                            ? "bg-blue-600/10 border-blue-600/30 text-blue-500" 
                                            : "bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5 hover:border-white/10"
                                    )}
                                >
                                    <t.icon className="w-4 h-4" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleSendBlast}
                            disabled={sending || filteredGuests.length === 0}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            {sending ? 'Sending...' : 'Execute Sequence Blast'}
                        </button>
                    </div>
                </div>

                {/* --- ACTIVE SEQUENCES --- */}
                <div className="lg:col-span-2 bg-[#111827] border border-white/[0.06] rounded-[2rem] overflow-hidden flex flex-col shadow-sm">
                    <div className="p-8 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Active Sequences</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Live Campaigns & Dispatch Records</p>
                        </div>
                        <History className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-8 py-4">Sequence Name</th>
                                    <th className="px-8 py-4">Segment</th>
                                    <th className="px-8 py-4">Performance</th>
                                    <th className="px-8 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {campaigns.map((c, i) => (
                                    <tr key={i} className="text-xs group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3 font-bold text-white uppercase tracking-tight">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                {c.name}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-gray-400 font-medium">
                                            {c.segment}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="w-full max-w-[100px] h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-blue-600" style={{ width: `${c.performance}%` }} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-emerald-500 uppercase text-[9px]">
                                            {c.status}
                                        </td>
                                    </tr>
                                ))}
                                {campaigns.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-600">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">No active sequences recorded</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- AUDIENCE MATRIX (Bottom Horizontal) --- */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                 <div className="p-8 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Audience Matrix</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Real-time Segment Tracking</p>
                        </div>
                    </div>
                    <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-lg text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                        {filteredGuests.length} IN SEGMENT
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 bg-black/10">
                                <th className="px-8 py-4">Participant</th>
                                <th className="px-8 py-4 hidden md:table-cell">Contact</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Loyalty Index</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredGuests.map((g, i) => (
                                <tr key={i} className="text-xs group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold border border-blue-600/20">
                                                {g.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-white uppercase tracking-tight">{g.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 hidden md:table-cell text-gray-500">
                                        {g.email || g.phone}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Verified</span>
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {[...Array(Math.min(3, g.stays))].map((_, star) => (
                                                <Star key={star} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                            ))}
                                            <span className="ml-2 font-bold text-white">{g.stays}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
