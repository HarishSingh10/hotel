'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, Download, CreditCard,
    TrendingUp, Wallet, ArrowUpRight,
    FileText, Calendar, Eye,
    ArrowRight, Loader2, DollarSign,
    CheckCircle2, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function PayrollPage() {
    const router = useRouter()
    const [downloading, setDownloading] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [slips, setSlips] = useState<any[]>([])

    const fetchPayrollData = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/payroll')
            if (res.ok) {
                const json = await res.json()
                setSlips(json)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPayrollData()
    }, [fetchPayrollData])

    const handleDownload = (id: string, month: string) => {
        setDownloading(id)
        setTimeout(() => {
            setDownloading(null)
            alert(`Pay slip for ${month} downloaded successfully.`)
        }, 1500)
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )

    const latestSlip = slips[0] || null
    const totalEarningsYear = slips.reduce((acc, curr) => acc + curr.netSalary, 0)

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-white tracking-tight italic">Salary Slips</h1>
                <div className="w-10"></div>
            </div>

            {/* Account Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10 flex items-start justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 mb-1">Last Credit</p>
                        <p className="text-3xl font-black text-white tracking-tighter italic">
                            {latestSlip ? `$${latestSlip.netSalary.toLocaleString()}` : '$0.00'}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div className="bg-white/10 border border-white/10 rounded-2xl p-3">
                        <p className="text-[9px] font-bold text-blue-100/50 uppercase tracking-widest mb-1">Fiscal Year</p>
                        <p className="text-sm font-black text-white">2023 - 24</p>
                    </div>
                    <div className="bg-white/10 border border-white/10 rounded-2xl p-3">
                        <p className="text-[9px] font-bold text-blue-100/50 uppercase tracking-widest mb-1">Tax Status</p>
                        <p className="text-sm font-black text-white italic flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Compliant
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161b22] border border-white/[0.05] p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Total Earnings</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-white">${(totalEarningsYear / 1000).toFixed(1)}k</p>
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-[9px] font-bold text-emerald-500/60 mt-1 uppercase tracking-widest">+12% from LY</p>
                </div>
                <div className="bg-[#161b22] border border-white/[0.05] p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Deductions</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-white">$4.2k</p>
                        <TrendingUp className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-[9px] font-bold text-rose-500/40 mt-1 uppercase tracking-widest">Insurance & Tax</p>
                </div>
            </div>

            {/* Slips List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Payment History</h3>
                    <Filter className="w-4 h-4 text-gray-600" />
                </div>
                <div className="space-y-3">
                    {slips.length === 0 ? (
                        <div className="py-12 text-center bg-[#161b22] rounded-3xl border border-dashed border-white/10">
                            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-600">No payment records found</p>
                        </div>
                    ) : (
                        slips.map((slip, i) => (
                            <div key={slip.id} className="bg-[#161b22] border border-white/[0.05] p-5 rounded-3xl group hover:border-white/10 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#0d1117] border border-white/[0.05] rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white tracking-tight italic">{slip.month} {slip.year}</h4>
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                                {slip.paidAt ? `Paid on ${format(new Date(slip.paidAt), 'MMM dd, yyyy')}` : 'Payment Pending'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white tracking-tighter">${slip.netSalary.toLocaleString()}</p>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest flex items-center justify-end gap-1",
                                            slip.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'
                                        )}>
                                            {slip.status === 'PAID' && <CheckCircle2 className="w-2.5 h-2.5" />} {slip.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-white/[0.02] p-3 rounded-xl">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gross Salary</p>
                                        <p className="text-xs font-black text-gray-300">${slip.grossSalary.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/[0.02] p-3 rounded-xl">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Net Pay</p>
                                        <p className="text-xs font-black text-emerald-400 font-black tracking-tight">${slip.netSalary.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDownload(slip.id, `${slip.month} ${slip.year}`)}
                                        disabled={downloading === slip.id}
                                        className="flex-1 h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {downloading === slip.id ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <><Download className="w-4 h-4" /> Download PDF</>}
                                    </button>
                                    <button className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Tip */}
            <div className="bg-[#161b22] border border-white/[0.05] p-5 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-[11px] font-bold text-gray-500 leading-relaxed italic mt-1">Pay slips are automatically generated on the 1st of every month. For queries, contact HR finance desk.</p>
            </div>
        </div>
    )
}
