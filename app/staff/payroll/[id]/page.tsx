'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, Download, ChevronLeft, Building2, CheckCircle, ShieldCheck, Zap, ScrollText, BadgeCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function StaffSalarySlipPage() {
    const { id } = useParams()
    const router = useRouter()
    const [payroll, setPayroll] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const slipRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchSlip = async () => {
            try {
                const res = await fetch(`/api/staff/payroll`)
                if (res.ok) {
                    const allPayroll = await res.json()
                    const slip = allPayroll.find((p: any) => p.id === id)
                    setPayroll(slip)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchSlip()
    }, [id])

    const handlePrint = () => {
        window.print()
    }

    const handleDownloadPDF = async () => {
        setDownloading(true)
        try {
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

            const staffName = payroll.staff?.user?.name || 'Staff Member'
            const slipId = `ZB-PAY-${payroll.id.substring(payroll.id.length - 6).toUpperCase()}`

            const indigo = [99, 102, 241] as [number, number, number]
            const slate900 = [15, 23, 42] as [number, number, number]
            const slate600 = [71, 85, 105] as [number, number, number]
            const slate400 = [148, 163, 184] as [number, number, number]
            const white = [255, 255, 255] as [number, number, number]

            doc.setFillColor(...indigo)
            doc.rect(0, 0, 210, 36, 'F')

            doc.setTextColor(...white)
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.text('ZENBOURG OS', 14, 16)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text('Performance Verified Pay Slip', 14, 24)
            doc.text(`${payroll.month} ${payroll.year}`, 14, 30)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.text(slipId, 196, 16, { align: 'right' })
            doc.text('FINANCIAL CRYPTO-SIGNATURE ACTIVE', 196, 24, { align: 'right' })

            let y = 50
            doc.setTextColor(...indigo)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.text('OPERATIONAL IDENTITIES', 14, y)
            doc.line(14, y + 1.5, 95, y + 1.5)
            y += 8

            const infoRows = [
                ['Name', staffName],
                ['Employee ID', payroll.staff?.employeeId || 'N/A'],
                ['Designation', payroll.staff?.designation || 'N/A'],
                ['Department', payroll.staff?.department || 'N/A'],
            ]

            infoRows.forEach(([label, value]) => {
                doc.setTextColor(...slate400)
                doc.setFontSize(8)
                doc.setFont('helvetica', 'normal')
                doc.text(label, 14, y)
                doc.setTextColor(...slate900)
                doc.setFont('helvetica', 'bold')
                doc.text(value, 50, y)
                y += 6
            })

            y = 100
            doc.setFillColor(...indigo)
            doc.rect(14, y, 182, 9, 'F')
            doc.setTextColor(...white)
            doc.text('EARNINGS DESCRIPTION', 18, y + 6)
            doc.text('AMOUNT (INR)', 192, y + 6, { align: 'right' })
            y += 9

            const tableRows = [
                ['Basic Salary', payroll.baseSalary],
                ['Performance Incentive', payroll.incentives || 0],
                ['Bonus Credits', payroll.bonuses || 0],
                ['Deductions', -(payroll.deductions || 0)],
            ]

            tableRows.forEach(([label, amount], idx) => {
                doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
                doc.rect(14, y, 182, 9, 'F')
                doc.setTextColor(...slate600)
                doc.text(String(label), 18, y + 6)
                doc.setTextColor(...slate900)
                doc.text(formatCurrency(Number(amount)), 192, y + 6, { align: 'right' })
                y += 9
            })

            doc.setFillColor(...indigo)
            doc.rect(14, y, 182, 13, 'F')
            doc.setTextColor(...white)
            doc.setFontSize(10)
            doc.text('NET DISBURSEMENT', 18, y + 8)
            doc.setFontSize(13)
            doc.text(formatCurrency(payroll.netSalary), 192, y + 8, { align: 'right' })

            doc.save(`Payslip_${payroll.month}_${payroll.year}.pdf`)
            toast.success("Payload Transferred", { description: "Salary slip downloaded successfully" })
        } catch (err) {
            console.error(err)
            window.print()
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Decrypting Financial Record...</p>
        </div>
    )

    if (!payroll) return (
        <div className="p-12 text-center bg-[#0d1117] min-h-screen flex flex-col items-center justify-center">
            <ShieldCheck className="w-16 h-16 text-rose-500/20 mb-4" />
            <h2 className="text-xl font-black text-rose-500 italic uppercase">Access Denied</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-widest">Financial record ID mismatch or non-existent</p>
            <button onClick={() => router.back()} className="mt-8 px-6 py-3 bg-white/5 rounded-xl text-xs font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Return to Vault</button>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 pb-20 font-sans selection:bg-blue-500/30 p-4 md:p-10">
            {/* Control Bar: Adaptive */}
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-8 no-print">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-[22px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-500 hover:text-white transition-all active:scale-95 shadow-inner"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handlePrint}
                        className="flex-1 md:flex-none h-14 md:h-12 px-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="flex-[2] md:flex-none h-14 md:h-12 px-8 rounded-2xl bg-blue-600 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Downlowd PDF
                    </button>
                </div>
            </div>

            {/* High-Fidelity Slip: Mobile Optimized */}
            <div ref={slipRef} className="max-w-4xl mx-auto bg-white text-[#0d1117] rounded-[45px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden slip-printable overflow-x-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/[0.03] blur-[100px] rounded-full translate-x-32 -translate-y-32 no-print"></div>
                
                {/* Header Section: Stacked on Mobile */}
                <div className="p-8 md:p-16">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-12 md:mb-16 pb-10 border-b-2 border-blue-600/10">
                        <div className="flex items-center gap-5 md:gap-8 mb-8 md:mb-0">
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-600 rounded-[24px] md:rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 shrink-0">
                                <Building2 className="w-8 h-8 md:w-12 md:h-12" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none mb-2 md:mb-3">ZENBOURG</h1>
                                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-blue-600/60 flex items-center gap-2 italic">
                                    <ScrollText className="w-3 h-3 md:w-4 md:h-4" /> Operational Payout {payroll.month} {payroll.year}
                                </p>
                            </div>
                        </div>
                        <div className="md:text-right w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0 border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center md:justify-end gap-2">
                                <BadgeCheck className="w-3 h-3 text-blue-500" /> Record Intelligence ID
                            </p>
                            <p className="text-xl md:text-2xl font-mono font-black text-gray-900 tracking-tighter">ZB-PAY-{payroll.id.substring(payroll.id.length - 6).toUpperCase()}</p>
                            <div className="flex items-center md:justify-end gap-2 mt-4 no-print">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified System Transfer</span>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid: Single Column on Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-12 md:mb-16">
                        <div className="space-y-6">
                            <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-blue-600 border-b border-blue-50 pb-2 italic">Staff Identity</h3>
                            <div className="grid grid-cols-2 gap-y-5">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Name</span>
                                <span className="text-sm font-black text-gray-900 border-b border-blue-100 pb-0.5">{payroll.staff?.user?.name || 'Staff Member'}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal ID</span>
                                <span className="text-sm font-bold text-gray-900 tracking-tight">{payroll.staff?.employeeId || 'N/A'}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Core</span>
                                <span className="text-sm font-bold text-gray-900 tracking-tight">{payroll.staff?.department || 'Operations'}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Rank</span>
                                <span className="text-sm font-bold text-gray-900 tracking-tight">{payroll.staff?.designation || 'Specialist'}</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-blue-600 border-b border-blue-50 pb-2 italic">Ledger Metadata</h3>
                            <div className="grid grid-cols-2 gap-y-5">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle Date</span>
                                <span className="text-sm font-bold text-gray-800">{payroll.month} {payroll.year}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Log</span>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl w-fit italic",
                                    payroll.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                )}>
                                    {payroll.status} Procured
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sync Timestamp</span>
                                <span className="text-sm font-bold text-gray-800">{format(new Date(payroll.updatedAt), 'dd MMM yyyy')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Earnings Matrix: Scrollable on Mobile for safety */}
                    <div className="border border-gray-100 rounded-[30px] md:rounded-[45px] overflow-hidden mb-12 md:mb-16 shadow-2xl shadow-blue-900/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[500px] md:min-w-0">
                                <thead>
                                    <tr className="bg-blue-600 text-white">
                                        <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] italic leading-none">Component Description</th>
                                        <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-right italic leading-none">Quantum (INR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <tr className="bg-white">
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-[12px] md:text-sm font-black text-gray-700 italic">Base Operational Salary</td>
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-base md:text-xl font-mono font-black text-gray-900 text-right tracking-tighter">{formatCurrency(payroll.baseSalary)}</td>
                                    </tr>
                                    <tr className="bg-gray-50/40">
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-[12px] md:text-sm font-black text-gray-700 italic">Incentive Modifiers</td>
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-sm md:text-base font-mono font-black text-emerald-500 text-right tracking-tighter">+{formatCurrency(payroll.incentives || 0)}</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-[12px] md:text-sm font-black text-gray-700 italic">Resource Bonuses</td>
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-sm md:text-base font-mono font-black text-emerald-500 text-right tracking-tighter">+{formatCurrency(payroll.bonuses || 0)}</td>
                                    </tr>
                                    <tr className="bg-rose-50/40">
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-[12px] md:text-sm font-black text-rose-800 italic">Operational Deductions</td>
                                        <td className="px-6 md:px-10 py-5 md:py-6 text-sm md:text-base font-mono font-black text-rose-500 text-right tracking-tighter">-{formatCurrency(payroll.deductions || 0)}</td>
                                    </tr>
                                    <tr className="bg-blue-600">
                                        <td className="px-6 md:px-10 py-6 md:py-9 text-base md:text-xl font-black text-white uppercase tracking-tighter italic">Total Resource Disbursement</td>
                                        <td className="px-6 md:px-10 py-6 md:py-9 text-2xl md:text-4xl font-mono font-black text-white text-right tracking-[ -0.05em ]">{formatCurrency(payroll.netSalary)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Technical Authorization: Stacked on Mobile */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-t border-gray-100 pt-10 md:pt-12 gap-10">
                        <div className="space-y-5 w-full md:w-auto">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">System Authentication Seal</p>
                            <div className="w-full md:w-64 h-20 border-2 border-dashed border-gray-100 bg-gray-50/30 rounded-[28px] flex items-center justify-center italic text-[11px] text-gray-400 font-bold pointer-events-none">
                                DIGITAL SIGNATURE ACTIVE
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest leading-none italic">Zenbourg Operational Command</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Property Group HR Finance Unit</p>
                            </div>
                        </div>
                        <div className="md:text-right text-gray-400 space-y-3 w-full md:w-auto">
                            <div className="flex items-center md:justify-end gap-3 px-4 py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100 inline-flex">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shadow-xl" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Audit Protocol Active</p>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest flex items-center md:justify-end gap-2">
                                <Zap className="w-3 h-3 text-blue-500" /> Handshake: {format(new Date(), 'dd MMM yyyy HH:mm')}
                            </p>
                            <p className="text-[9px] font-medium italic opacity-40">Zenbourg Operational OS (Internal Use Only) • 2026</p>
                        </div>
                    </div>
                </div>

                {/* Authenticity Watermark: Centered and subtle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[ -35deg ] opacity-[ 0.015 ] pointer-events-none no-print whitespace-nowrap">
                    <h1 className="text-[12rem] md:text-[18rem] font-black uppercase tracking-[0.6em] text-blue-900 leading-none">AUTHENTIC</h1>
                </div>
            </div>

            <style jsx>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .slip-printable { 
                        box-shadow: none !important; 
                        border: none !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                        border-radius: 0 !important;
                        padding: 15mm !important;
                    }
                }
            `}</style>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return <Zap className={cn("animate-pulse", className)} />
}
