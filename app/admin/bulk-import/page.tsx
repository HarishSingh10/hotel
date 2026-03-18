'use client'

import { useState, useRef } from 'react'
import {
    Upload, Download, Rocket, FileText, CheckCircle2,
    AlertCircle, AlertTriangle, ChevronDown, Trash2,
    Database, Map as MapIcon, Table as TableIcon,
    Loader2, X, FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function BulkImportPage() {
    const [file, setFile] = useState<File | null>(null)
    const [validating, setValidating] = useState(false)
    const [importing, setImporting] = useState(false)
    const [step, setStep] = useState(1) // 1: Upload, 2: Mapping, 3: Preview
    const [previewData, setPreviewData] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        warnings: 0,
        invalid: 0
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setStats({ total: 1248, valid: 1180, warnings: 42, invalid: 26 })
            toast.success('File uploaded successfully')
        }
    }

    const runValidation = () => {
        setValidating(true)
        setTimeout(() => {
            setValidating(false)
            setStep(3)
            setPreviewData([
                { status: 'Ready', name: 'Jonathan Wick', checkIn: '2023-11-12', type: 'Deluxe King', source: 'Booking.com', notes: 'No errors', typeClass: 'text-emerald-500' },
                { status: 'Alert', name: 'Sarah Connor', checkIn: '2023-12-01', type: 'Standard', source: 'Direct', notes: 'Duplicate Email', typeClass: 'text-amber-500' },
                { status: 'Error', name: 'Ellen Ripley', checkIn: 'INVALID_DATE', type: 'Suite', source: 'Expedia', notes: 'Check-in > Check-out', typeClass: 'text-red-500' },
                { status: 'Ready', name: 'Bruce Wayne', checkIn: '2024-01-15', type: 'Penthouse', source: 'Luxury Travel', notes: 'No errors', typeClass: 'text-emerald-500' },
                { status: 'Ready', name: 'Diana Prince', checkIn: '2023-11-20', type: 'Deluxe King', source: 'Direct', notes: 'No errors', typeClass: 'text-emerald-500' },
                { status: 'Alert', name: 'Peter Parker', checkIn: '2023-11-25', type: 'Budget Twin', source: 'Airbnb', notes: 'Incomplete Address', typeClass: 'text-amber-500' },
            ])
            toast.info('Validation complete. Review the results below.')
        }, 2000)
    }

    const startImport = () => {
        setImporting(true)
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 3000)),
            {
                loading: 'Synchronizing bookings with property calendar...',
                success: () => {
                    setImporting(false)
                    return 'Import successful! 1,180 bookings added.'
                },
                error: 'Import failed'
            }
        )
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span className="hover:text-white cursor-pointer transition-colors">Dashboard</span>
                            <span>•</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Bookings</span>
                            <span>•</span>
                            <span className="text-blue-500">Bulk Import</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Bulk Booking Import</h1>
                        <p className="text-gray-500 font-medium text-lg">Batch upload guest data and synchronize your property calendar.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 bg-[#161b22] border border-white/5 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all">
                            <Download className="w-4 h-4" /> Download Template
                        </button>
                        <button
                            onClick={startImport}
                            disabled={importing || step < 3}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] uppercase tracking-widest"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            Start Import
                        </button>
                    </div>
                </div>

                {/* ── TOP STATS ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Rows Detected', value: stats.total.toLocaleString(), color: 'border-white/5 bg-[#161b22]' },
                        { label: 'Valid Rows', value: stats.valid.toLocaleString(), color: 'border-emerald-500/20 bg-emerald-500/5', tag: '94.5%', tagColor: 'bg-emerald-500 text-white' },
                        { label: 'Warnings', value: stats.warnings, color: 'border-amber-500/20 bg-amber-500/5', tagColor: 'text-amber-500' },
                        { label: 'Invalid Rows', value: stats.invalid, color: 'border-red-500/20 bg-red-500/5', tagColor: 'text-red-500' },
                    ].map((s, i) => (
                        <div key={i} className={cn("border rounded-2xl p-7 relative transition-all hover:scale-[1.02]", s.color)}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{s.label}</p>
                            <div className="flex items-center gap-4">
                                <p className="text-4xl font-black text-white">{s.value}</p>
                                {s.tag && (
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black", s.tagColor)}>{s.tag}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MAIN CONTENT ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Upload & Mapping */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 1. Upload File */}
                        <div className="bg-[#161b22] border border-white/5 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-black text-xs">1</div>
                                <h3 className="text-lg font-bold text-white">Upload File</h3>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed border-white/5 rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-blue-500/30 group relative overflow-hidden",
                                    file && "bg-blue-600/5 border-blue-500/20"
                                )}
                            >
                                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx" />
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg">Drop your file here</p>
                                        <p className="text-gray-500 text-sm mt-1">Supports CSV, XLSX up to 20MB</p>
                                    </div>
                                    <button className="mt-2 px-6 py-2.5 bg-[#0d1117] border border-white/5 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors">
                                        Browse files
                                    </button>
                                </div>
                            </div>

                            {file && (
                                <div className="mt-6 flex items-center gap-4 p-4 bg-[#0d1117] border border-white/5 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                                        <FileSpreadsheet className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{file.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">2.4MB • Uploaded 2m ago</p>
                                    </div>
                                    <button onClick={() => setFile(null)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Field Mapping */}
                        <div className="bg-[#161b22] border border-white/5 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-black text-xs">2</div>
                                    <h3 className="text-lg font-bold text-white">Field Mapping</h3>
                                </div>
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded tracking-tighter uppercase">Auto-Matched</span>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: 'Guest Full Name', value: 'guest_name' },
                                    { label: 'Check-in Date', value: 'arrival_date' },
                                    { label: 'Room Category', value: 'room_type' },
                                    { label: 'Booking Source', placeholder: '- Select Column -', error: true },
                                ].map((field, i) => (
                                    <div key={i} className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{field.label}</label>
                                        <div className="relative">
                                            <select
                                                className={cn(
                                                    "w-full bg-[#0d1117] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white appearance-none outline-none focus:border-blue-500/50 transition-all font-bold",
                                                    field.error && "border-red-500/30"
                                                )}
                                                defaultValue={field.value}
                                            >
                                                {field.placeholder && <option disabled value="">{field.placeholder}</option>}
                                                <option value="guest_name">guest_name</option>
                                                <option value="arrival_date">arrival_date</option>
                                                <option value="room_type">room_type</option>
                                                <option value="email">guest_email</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                        </div>
                                        {field.error && <p className="text-[10px] font-bold text-red-500">Missing required mapping</p>}
                                    </div>
                                ))}

                                <button
                                    onClick={runValidation}
                                    disabled={validating || !file}
                                    className="w-full mt-4 py-4 bg-[#0d1117] border border-white/5 hover:border-blue-500/50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
                                >
                                    {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Validation'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Validation Preview */}
                    <div className="lg:col-span-8">
                        <div className="bg-[#161b22] border border-white/5 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-black text-xs">3</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Validation Preview</h3>
                                        <p className="text-xs text-gray-500 font-medium tracking-tight">Showing first 100 rows of your dataset</p>
                                    </div>
                                </div>
                                <div className="bg-[#0d1117] p-1 rounded-xl flex items-center gap-1">
                                    <button className="px-5 py-2 bg-[#161b22] text-xs font-bold text-white rounded-lg transition-all shadow-xl">All</button>
                                    <button className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-white transition-all">Errors Only</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#0d1117] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">Guest Name</th>
                                            <th className="px-8 py-5">Check-in</th>
                                            <th className="px-8 py-5">Room Type</th>
                                            <th className="px-8 py-5">Source</th>
                                            <th className="px-8 py-5">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            row.status === 'Ready' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                                row.status === 'Alert' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                                                    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                        )} />
                                                        <span className="text-[11px] font-black uppercase tracking-tighter text-gray-300">{row.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-bold text-white truncate max-w-[150px] block">{row.name}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn("text-xs font-black tracking-widest uppercase", row.checkIn === 'INVALID_DATE' ? "text-red-500 bg-red-500/10 px-2 py-1 rounded" : "text-gray-400")}>
                                                        {row.checkIn}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs text-gray-400 font-medium">{row.type}</span>
                                                </td>
                                                <td className="px-8 py-6 text-xs text-gray-400 font-medium">
                                                    {row.source}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all",
                                                        row.status === 'Ready' ? "border-emerald-500/10 bg-emerald-500/5 text-gray-600" :
                                                            row.status === 'Alert' ? "border-amber-500/20 bg-amber-500/10 text-amber-500" :
                                                                "border-red-500/20 bg-red-500/10 text-red-500"
                                                    )}>
                                                        {row.notes}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {previewData.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20 group">
                                                        <TableIcon className="w-16 h-16 group-hover:scale-110 transition-transform duration-500" />
                                                        <div className="space-y-1">
                                                            <p className="text-lg font-black uppercase tracking-[0.3em]">No Preview Data</p>
                                                            <p className="text-sm font-medium italic">Upload a file and run validation to see results</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 border-t border-white/5 flex items-center justify-between bg-[#0d1117]/30">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Rows 1-6 of 1,248</p>
                                <div className="flex items-center gap-3">
                                    <button className="p-3 bg-white/5 rounded-xl text-gray-600 cursor-not-allowed border border-white/5 transition-all">
                                        <ChevronDown className="w-4 h-4 rotate-90" />
                                    </button>
                                    <button className="p-3 bg-white/5 rounded-xl text-white border border-white/10 hover:bg-white/10 transition-all shadow-xl">
                                        <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
