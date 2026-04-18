'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
    Upload, Download, Rocket, FileText, CheckCircle2,
    AlertCircle, AlertTriangle, ChevronDown, Trash2,
    Database, Map as MapIcon, Table as TableIcon,
    Loader2, X, FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getAdminContext } from '@/lib/admin-context'

export default function BulkImportPage() {
    const { data: session } = useSession()
    const [file, setFile] = useState<File | null>(null)
    const [validating, setValidating] = useState(false)
    const [importing, setImporting] = useState(false)
    const [step, setStep] = useState(1)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [rawData, setRawData] = useState<any[]>([])
    const [importResult, setImportResult] = useState<any>(null)
    const [stats, setStats] = useState({ total: 0, valid: 0, warnings: 0, invalid: 0 })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const propertyId = session?.user?.role === 'SUPER_ADMIN'
        ? getAdminContext().propertyId
        : session?.user?.propertyId

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile)
        setImportResult(null)
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            const lines = text.split('\n').filter(l => l.trim() !== '')
            if (lines.length < 2) { toast.error('File has no data rows'); return }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
            const rows = lines.slice(1).map((line, idx) => {
                const values = line.split(',')
                const obj: any = { _rowNum: idx + 2 }
                headers.forEach((h, i) => { obj[h] = values[i]?.trim() || '' })
                return obj
            })

            // Validate each row
            const parsed = rows.map(r => {
                const errors: string[] = []
                const warnings: string[] = []
                const name = r.guest_name || r.name || r.guest || ''
                const phone = r.guest_phone || r.phone || r.mobile || ''
                const checkIn = r.check_in || r.checkin || r.arrival || ''
                const checkOut = r.check_out || r.checkout || r.departure || ''
                const roomNumber = r.room_number || r.room || r.room_no || ''
                const email = r.guest_email || r.email || ''

                if (!name) errors.push('Missing guest name')
                if (!phone) errors.push('Missing phone')
                if (!checkIn) errors.push('Missing check-in date')
                if (!checkOut) errors.push('Missing check-out date')
                if (checkIn && isNaN(Date.parse(checkIn))) errors.push('Invalid check-in (use YYYY-MM-DD)')
                if (checkOut && isNaN(Date.parse(checkOut))) errors.push('Invalid check-out (use YYYY-MM-DD)')
                if (checkIn && checkOut && !isNaN(Date.parse(checkIn)) && !isNaN(Date.parse(checkOut))) {
                    if (new Date(checkOut) <= new Date(checkIn)) errors.push('Check-out must be after check-in')
                }
                if (!email) warnings.push('No email')
                if (!roomNumber) warnings.push('No room number — will auto-assign')

                return {
                    ...r,
                    _name: name, _phone: phone, _checkIn: checkIn, _checkOut: checkOut,
                    _roomNumber: roomNumber, _email: email,
                    _source: (r.source || 'DIRECT').toUpperCase(),
                    _amount: parseFloat(r.total_amount || r.amount || '0') || 0,
                    _errors: errors, _warnings: warnings,
                    _valid: errors.length === 0,
                }
            })

            const validCount = parsed.filter(r => r._valid).length
            const warnCount = parsed.filter(r => r._valid && r._warnings.length > 0).length
            const invalidCount = parsed.filter(r => !r._valid).length

            setStats({ total: parsed.length, valid: validCount, warnings: warnCount, invalid: invalidCount })
            setPreviewData(parsed.slice(0, 100).map(r => ({
                status: r._errors.length > 0 ? 'Error' : r._warnings.length > 0 ? 'Alert' : 'Ready',
                name: r._name || 'Unknown',
                checkIn: r._checkIn || 'N/A',
                type: r._roomNumber || 'Auto-assign',
                source: r._source || 'DIRECT',
                notes: r._errors.length > 0 ? r._errors[0] : r._warnings.length > 0 ? r._warnings[0] : 'No errors',
                _valid: r._valid,
            })))
            setRawData(parsed)
            setStep(3) // Auto-advance to preview step
            toast.success(`File processed: ${parsed.length} records found — ${validCount} ready to import`)
        }
        reader.readAsText(selectedFile)
    }

    const runValidation = () => { if (file) setStep(3) }

    const startImport = async () => {
        const validRows = rawData.filter(r => r._valid)
        if (validRows.length === 0) { toast.error('No valid rows to import'); return }
        if (!propertyId || propertyId === 'ALL') { toast.error('Select a hotel first'); return }

        setImporting(true)
        try {
            const payload = validRows.map(r => ({
                guestName: r._name,
                guestPhone: r._phone,
                guestEmail: r._email,
                checkIn: r._checkIn,
                checkOut: r._checkOut,
                roomNumber: r._roomNumber,
                guestsCount: parseInt(r.guests_count || r.pax || '1') || 1,
                source: r._source,
                totalAmount: r._amount,
                notes: r.notes || '',
                rowNum: r._rowNum,
            }))

            const res = await fetch('/api/admin/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: payload, propertyId }),
            })
            const data = await res.json()
            if (data.success) {
                setImportResult(data)
                const msg = `${data.created} booking${data.created !== 1 ? 's' : ''} created, ${data.guestsCreated} new guest${data.guestsCreated !== 1 ? 's' : ''}`
                toast.success(`Import complete! ${msg}`)
                if (data.errors?.length > 0) {
                    data.errors.forEach((e: string) => toast.error(e, { duration: 6000 }))
                }
                // Don't reset step — keep preview visible so user can see what was imported
            } else {
                toast.error(data.error ?? 'Import failed')
            }
        } catch { toast.error('Something went wrong during import') }
        finally { setImporting(false) }
    }

    const handleDownloadTemplate = () => {
        const headers = ['guest_name', 'guest_phone', 'guest_email', 'check_in', 'check_out', 'room_number', 'guests_count', 'source', 'total_amount', 'notes']
        const sampleData = [
            'Rahul Sharma,9876543210,rahul@email.com,2026-05-01,2026-05-04,101,2,DIRECT,5000,Anniversary trip',
            'Priya Patel,9876543221,priya@email.com,2026-05-02,2026-05-05,202,1,BOOKING_COM,3500,',
            'Amit Kumar,9876543232,,2026-05-03,2026-05-06,301,3,WALK_IN,7200,Early check-in requested',
        ]
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleData].join('\n')
        const link = document.createElement('a')
        link.setAttribute('href', encodeURI(csvContent))
        link.setAttribute('download', 'bulk_booking_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Template downloaded — fill in your data and upload')
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* ΓöÇΓöÇ HEADER ΓöÇΓöÇ */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span className="hover:text-white cursor-pointer transition-colors">Dashboard</span>
                            <span>ΓÇó</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Bookings</span>
                            <span>ΓÇó</span>
                            <span className="text-blue-500">Bulk Import</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Bulk Booking Import</h1>
                        <p className="text-gray-500 font-medium text-lg">Batch upload guest data and synchronize your property calendar.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-6 py-3 bg-[#161b22] border border-white/5 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                        >
                            <Download className="w-4 h-4" /> Download Template
                        </button>
                        <button
                            onClick={startImport}
                            disabled={importing || rawData.filter(r => r._valid).length === 0}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] uppercase tracking-widest"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            Start Import
                        </button>
                    </div>
                </div>

                {/* ΓöÇΓöÇ TOP STATS ΓöÇΓöÇ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Rows Detected', value: stats.total.toLocaleString(), color: 'border-white/5 bg-[#161b22]' },
                        { label: 'Valid Rows', value: stats.valid.toLocaleString(), color: 'border-emerald-500/20 bg-emerald-500/5', tag: stats.total > 0 ? `${Math.round((stats.valid/stats.total)*100)}%` : '0%', tagColor: 'bg-emerald-500 text-white' },
                        { label: 'Warnings', value: stats.warnings, color: 'border-amber-500/20 bg-amber-500/5', tagColor: 'text-amber-500' },
                        { label: 'Invalid Rows', value: stats.invalid, color: 'border-red-500/20 bg-red-500/5', tagColor: 'text-red-500' },
                    ].map((s, i) => (
                        <div key={i} className={cn("border rounded-2xl p-7 relative transition-all hover:scale-[1.02]", s.color)}>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">{s.label}</p>
                            <div className="flex items-center gap-4">
                                <p className="text-4xl font-bold text-white">{s.value}</p>
                                {s.tag && (
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", s.tagColor)}>{s.tag}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Import Result Banner */}
                {importResult && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-white">Import Complete!</p>
                            <p className="text-sm text-gray-400 mt-1">
                                <span className="text-emerald-400 font-bold">{importResult.created}</span> bookings created &nbsp;·&nbsp;
                                <span className="text-emerald-400 font-bold">{importResult.guestsCreated}</span> new guests &nbsp;·&nbsp;
                                <span className="text-emerald-400 font-bold">{importResult.guestsUpdated}</span> guests updated &nbsp;·&nbsp;
                                <span className="text-amber-400 font-bold">{importResult.skipped}</span> rows skipped
                            </p>
                            {importResult.errors?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {importResult.errors.map((e: string, i: number) => (
                                        <p key={i} className="text-xs text-red-400">• {e}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── MAIN CONTENT ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Upload & Mapping */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 1. Upload File */}
                        <div className="bg-[#161b22] border border-white/5 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-xs">1</div>
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
                                    <button className="mt-2 px-6 py-2.5 bg-[#0d1117] border border-white/5 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors">
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
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">2.4MB ΓÇó Uploaded 2m ago</p>
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
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-xs">2</div>
                                    <h3 className="text-lg font-bold text-white">Field Mapping</h3>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded tracking-tighter uppercase">Auto-Matched</span>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: 'Guest Full Name', value: 'guest_name' },
                                    { label: 'Check-in Date', value: 'check_in' },
                                    { label: 'Room Number', value: 'room_number' },
                                    { label: 'Booking Source', value: 'source' },
                                ].map((field, i) => (
                                    <div key={i} className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{field.label}</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-[#0d1117] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white appearance-none outline-none focus:border-blue-500/50 transition-all font-bold"
                                                defaultValue={field.value}
                                            >
                                                <option value="guest_name">guest_name</option>
                                                <option value="check_in">check_in</option>
                                                <option value="room_number">room_number</option>
                                                <option value="source">source</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={runValidation}
                                    disabled={validating || !file}
                                    className="w-full mt-4 py-4 bg-[#0d1117] border border-white/5 hover:border-blue-500/50 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
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
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-xs">3</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Validation Preview</h3>
                                        <p className="text-xs text-gray-500 font-medium tracking-tight">Showing first 100 rows of your dataset</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#0d1117] text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
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
                                                        <span className="text-[11px] font-bold uppercase tracking-tighter text-gray-300">{row.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-bold text-white truncate max-w-[150px] block">{row.name}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn("text-xs font-bold tracking-widest uppercase", row.checkIn === 'INVALID_DATE' ? "text-red-500 bg-red-500/10 px-2 py-1 rounded" : "text-gray-400")}>
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
                                                        "px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all",
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
                                                            <p className="text-lg font-bold uppercase tracking-[0.3em]">No Preview Data</p>
                                                            <p className="text-sm font-medium ">Upload a file and run validation to see results</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 border-t border-white/5 flex items-center justify-between bg-[#0d1117]/30">
                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Rows 1-6 of 1,248</p>
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
