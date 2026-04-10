'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, Download, ChevronLeft, Building2, CheckCircle, ShieldCheck, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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
                // Fetch direct from the payroll API
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
            const emerald = [16, 185, 129] as [number, number, number]
            const white = [255, 255, 255] as [number, number, number]
            const lightGray = [248, 250, 252] as [number, number, number]

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
        <div className="min-h-screen bg-[#0d1117] text-gray-300 pb-20 font-sans selection:bg-blue-500/30 p-5">
            {/* Control Bar */}
            <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 no-print">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-500 hover:text-white transition-all active:scale-95 shadow-inner"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="h-12 px-6 rounded-xl bg-blue-600 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Downlowd PDF
                    </button>
                </div>
            </div>

            {/* High-Fidelity Slip */}
            <div ref={slipRef} className="max-w-3xl mx-auto bg-white text-[#0d1117] p-10 md:p-16 rounded-[45px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden slip-printable">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/[0.03] blur-[100px] rounded-full translate-x-32 -translate-y-32 no-print"></div>
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-16 pb-10 border-b-4 border-blue-600">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
                            <Building2 className="w-12 h-12" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2">ZENBOURG</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600/60 flex items-center gap-2 italic">
                                <Zap className="w-3 h-3 fill-blue-600" /> Operational Slip {payroll.month} {payroll.year}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 md:mt-0 md:text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Record Intelligence ID</p>
                        <p className="text-2xl font-mono font-black text-gray-900 tracking-tighter">ZB-PAY-{payroll.id.substring(payroll.id.length - 6).toUpperCase()}</p>
                        <div className="flex items-center md:justify-end gap-2 mt-3 no-print">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified Disbursement</span>
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 border-b border-blue-50/50 pb-2 italic">Entity Information</h3>
                        <div className="grid grid-cols-2 gap-y-4">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Name</span>
                            <span className="text-sm font-black text-gray-900 italic underline underline-offset-4 decoration-blue-100">{payroll.staff?.user?.name || 'Staff Member'}</span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Employee ID</span>
                            <span className="text-sm font-black text-gray-900 tracking-tight">{payroll.staff?.employeeId || 'N/A'}</span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Department</span>
                            <span className="text-sm font-black text-gray-900 tracking-tight">{payroll.staff?.department || 'N/A'}</span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Rank/Designation</span>
                            <span className="text-sm font-black text-gray-900 tracking-tight">{payroll.staff?.designation || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 border-b border-blue-50/50 pb-2 italic">Disbursement Intel</h3>
                        <div className="grid grid-cols-2 gap-y-4">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Pay Period</span>
                            <span className="text-sm font-black text-gray-800">{payroll.month} {payroll.year}</span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Crypto-Status</span>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl w-fit italic",
                                payroll.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            )}>
                                {payroll.status} Ready
                            </span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Sync Date</span>
                            <span className="text-sm font-black text-gray-800">{format(new Date(payroll.updatedAt), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                </div>

                {/* Earnings Matrix */}
                <div className="border border-gray-100 rounded-[35px] overflow-hidden mb-16 shadow-2xl shadow-blue-900/5">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] italic">Intelligence Description</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-right italic">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <tr className="bg-white">
                                <td className="px-8 py-5 text-sm font-black text-gray-700 italic">Base Salary Protocol</td>
                                <td className="px-8 py-5 text-lg font-mono font-black text-gray-900 text-right tracking-tighter">{formatCurrency(payroll.baseSalary)}</td>
                            </tr>
                            <tr className="bg-gray-50/30">
                                <td className="px-8 py-5 text-sm font-black text-gray-700 italic">Performance Incentives</td>
                                <td className="px-8 py-5 text-sm font-mono font-black text-emerald-500 text-right tracking-tighter">+{formatCurrency(payroll.incentives || 0)}</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-8 py-5 text-sm font-black text-gray-700 italic">Bonus Credits</td>
                                <td className="px-8 py-5 text-sm font-mono font-black text-emerald-500 text-right tracking-tighter">+{formatCurrency(payroll.bonuses || 0)}</td>
                            </tr>
                            <tr className="bg-rose-50/40">
                                <td className="px-8 py-5 text-sm font-black text-rose-800 italic">Deductions (Taxes/PF)</td>
                                <td className="px-8 py-5 text-sm font-mono font-black text-rose-500 text-right tracking-tighter">-{formatCurrency(payroll.deductions || 0)}</td>
                            </tr>
                            <tr className="bg-blue-600">
                                <td className="px-8 py-6 text-lg font-black text-white uppercase tracking-tighter italic">Total Operational Disbursement</td>
                                <td className="px-8 py-6 text-3xl font-mono font-black text-white text-right tracking-[ -0.05em ]">{formatCurrency(payroll.netSalary)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Technical Authorization */}
                <div className="flex flex-col md:flex-row justify-between items-end border-t border-gray-100 pt-12 gap-8">
                    <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Authorized System Cryptography</p>
                        <div className="w-56 h-16 border-b-2 border-gray-100 bg-gray-50/50 rounded-2xl flex items-center justify-center italic text-[10px] text-gray-300 pointer-events-none">
                            [ E-SIGNATURE VERIFIED ]
                        </div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest leading-none">Zenbourg Group HR Finance</p>
                    </div>
                    <div className="text-right text-gray-400 space-y-2">
                        <div className="flex items-center justify-end gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500/30" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Digitally Authenticated Slip</p>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest">Generated: {format(new Date(), 'dd MMM yyyy')}</p>
                        <p className="text-[9px] font-medium italic opacity-40">Zenbourg Operational OS Financial Services • 2026</p>
                    </div>
                </div>

                {/* Authenticity Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[ -35deg ] opacity-[ 0.02 ] pointer-events-none no-print">
                    <h1 className="text-9xl font-black uppercase tracking-[0.5em] text-blue-900 leading-none">ORIGINAL</h1>
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
                        padding: 20mm !important;
                    }
                }
            `}</style>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return <Zap className={cn("animate-pulse", className)} />
}
