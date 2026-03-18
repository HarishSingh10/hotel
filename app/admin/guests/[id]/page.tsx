'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
    ArrowLeft, Mail, Phone, MessageSquare, Edit, LogOut,
    Upload, CheckCircle2, Loader2, X, Plus, FileCheck, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ---- helpers ---- */
function getInitials(name: string) {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
}
const COLORS = ['bg-[#4A9EFF]', 'bg-[#1db954]', 'bg-[#805ad5]', 'bg-[#d4aa00]', 'bg-[#e53e3e]', 'bg-[#ed8936]']
function avatarColor(name: string) { return COLORS[name.charCodeAt(0) % COLORS.length] }

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    RESERVED: { label: 'Reserved', cls: 'bg-[#4A9EFF]/10 text-[#4A9EFF] border-[#4A9EFF]/20' },
    CHECKED_IN: { label: 'Active', cls: 'bg-[#1db954]/10 text-[#1db954] border-[#1db954]/20' },
    CHECKED_OUT: { label: 'Completed', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-[#e53e3e]/10 text-[#e53e3e] border-[#e53e3e]/20' },
    COMPLETED: { label: 'Completed', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
}

export default function GuestDetailPage() {
    const params = useParams()
    const router = useRouter()
    const guestId = params.id as string

    const [guest, setGuest] = useState<any>(null)
    const [bookings, setBookings] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [note, setNote] = useState('')
    const [notes, setNotes] = useState<{ author: string; time: string; text: string }[]>([])
    const [preferences, setPreferences] = useState<string[]>(['High Floor', 'Near Elevator', 'Vegetarian'])
    const [newPref, setNewPref] = useState('')
    const [uploading, setUploading] = useState<'front' | 'back' | null>(null)
    const frontRef = useRef<HTMLInputElement>(null)
    const backRef = useRef<HTMLInputElement>(null)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<any>({})

    const fetchGuest = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/guests/${guestId}/detail`)
            if (res.ok) {
                const data = await res.json()
                setGuest(data.guest)
                setBookings(data.bookings || [])
                setServices(data.services || [])
                setNotes(data.notes || [])
                setEditForm({ name: data.guest.name, email: data.guest.email, phone: data.guest.phone, address: data.guest.address })
            } else { toast.error('Failed to load guest') }
        } catch { toast.error('Network error') }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchGuest() }, [guestId])

    const handleUpload = async (side: 'front' | 'back', file: File) => {
        setUploading(side)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('side', side)
        fd.append('guestId', guestId)
        try {
            const res = await fetch('/api/admin/guests/upload', { method: 'POST', body: fd })
            if (res.ok) {
                const data = await res.json()
                setGuest((prev: any) => ({
                    ...prev,
                    idDocumentFront: side === 'front' ? data.url : prev.idDocumentFront,
                    idDocumentBack: side === 'back' ? data.url : prev.idDocumentBack,
                }))
                toast.success(`${side === 'front' ? 'Front' : 'Back'} document uploaded`)
            } else { toast.error('Upload failed') }
        } catch { toast.error('Upload failed') }
        finally { setUploading(null) }
    }

    const handleVerify = async () => {
        try {
            const res = await fetch(`/api/admin/guests/${guestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkInStatus: 'VERIFIED' }),
            })
            if (res.ok) { toast.success('Guest ID verified!'); fetchGuest() }
        } catch { toast.error('Failed to verify') }
    }

    const handleUpdate = async () => {
        try {
            const res = await fetch(`/api/admin/guests/${guestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            })
            if (res.ok) { toast.success('Profile updated'); setIsEditing(false); fetchGuest() }
        } catch { toast.error('Update failed') }
    }

    const handleCheckOut = async () => {
        const active = bookings.find(b => b.status === 'CHECKED_IN')
        if (!active) { toast.error('No active booking to check out'); return }
        setIsCheckingOut(true)
        try {
            const res = await fetch('/api/admin/bookings/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: active.id, action: 'CHECK_OUT' }),
            })
            if (res.ok) { toast.success('Guest checked out'); fetchGuest() }
            else toast.error('Failed to check out')
        } catch { toast.error('Something went wrong') }
        finally { setIsCheckingOut(false) }
    }

    const handlePostNote = () => {
        if (!note.trim()) return
        setNotes(prev => [{ author: 'Admin', time: 'Just now', text: note }, ...prev])
        setNote('')
        toast.success('Note posted')
    }

    const addPreference = () => {
        if (!newPref.trim()) return
        setPreferences(prev => [...prev, newPref.trim()])
        setNewPref('')
    }

    /* ---- Loading / Not found ---- */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }
    if (!guest) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-gray-400">Guest not found</p>
                <button onClick={() => router.back()} className="text-[#4A9EFF] text-sm hover:underline">← Go back</button>
            </div>
        )
    }

    const activeBooking = bookings.find(b => b.status === 'CHECKED_IN')
    const totalBill = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0)
    const paidAmount = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0)
    const dueBalance = totalBill - paidAmount
    const isVerified = guest.checkInStatus === 'VERIFIED' || guest.checkInStatus === 'COMPLETED'

    return (
        <div className="space-y-4 pb-8 animate-fade-in">

            {/* ── BREADCRUMB ── */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push('/admin/guests')}
                    className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Guests
                </button>
                <span className="text-gray-600">/</span>
                <span className="text-[12px] text-white font-medium">{guest.name}</span>
            </div>

            {/* ── PROFILE HEADER ── */}
            <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-6">
                {/* Top row: avatar + info + actions */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar */}
                    <div className={cn('w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 self-start', avatarColor(guest.name))}>
                        {getInitials(guest.name)}
                    </div>

                    {/* Name + contact */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{guest.name}</h1>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            {guest.email && (
                                <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                                    <Mail className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{guest.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                                <Phone className="w-3 h-3 shrink-0" /> +91 {guest.phone}
                            </div>
                        </div>
                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {activeBooking && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#1db954]/10 text-[#1db954] text-[10px] sm:text-[11px] font-bold rounded-full border border-[#1db954]/20 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse" /> CHECKED IN
                                </span>
                            )}
                            {isVerified && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#805ad5]/10 text-[#805ad5] text-[10px] sm:text-[11px] font-bold rounded-full border border-[#805ad5]/20 whitespace-nowrap">
                                    <Star className="w-3 h-3" /> VIP MEMBER
                                </span>
                            )}
                            {guest.language && (
                                <span className="px-2 py-0.5 bg-white/[0.04] text-gray-300 text-[10px] sm:text-[11px] font-medium rounded-full border border-white/[0.06] whitespace-nowrap">
                                    🏳️ {guest.language}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action buttons — wrap on small screens */}
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-[12px] font-medium rounded-lg transition-colors">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                            <span className="hidden xs:inline">Message</span>
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-[12px] font-medium rounded-lg transition-colors"
                        >
                            <Edit className="w-3.5 h-3.5 text-gray-400" />
                            <span className="hidden xs:inline">Edit Profile</span>
                        </button>
                        {activeBooking && (
                            <button
                                onClick={handleCheckOut}
                                disabled={isCheckingOut}
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-lg shadow-[#4A9EFF]/20 disabled:opacity-50 whitespace-nowrap"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                {isCheckingOut ? 'Processing...' : 'Check Out'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── BILLING CARDS ── */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                    <p className="text-[11px] text-gray-500 mb-2 font-medium">💳 Total Bill</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">₹{totalBill.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                    <p className="text-[11px] text-gray-500 mb-2 font-medium">💰 Paid Amount</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">₹{paidAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5 xs:col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-gray-500 mb-2 font-medium">⚠️ Due Balance</p>
                    <p className={cn('text-xl sm:text-2xl font-bold', dueBalance > 0 ? 'text-[#e53e3e]' : 'text-[#1db954]')}>
                        ₹{dueBalance.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* LEFT (2/3) */}
                <div className="lg:col-span-2 space-y-4">

                    {/* DOCUMENTS */}
                    <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[12px] sm:text-[13px] font-semibold text-white uppercase tracking-wide">Documents</h2>
                            <button
                                onClick={() => frontRef.current?.click()}
                                className="flex items-center gap-1 text-[11px] text-[#4A9EFF] hover:underline font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" /> Upload New
                            </button>
                        </div>

                        {/* Responsive doc grid */}
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            {/* Front */}
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className="relative w-28 h-20 sm:w-36 sm:h-24 bg-[#182433] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#4A9EFF]/40 transition-colors cursor-pointer group"
                                    onClick={() => frontRef.current?.click()}
                                >
                                    {uploading === 'front' ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-[#4A9EFF] animate-spin" />
                                        </div>
                                    ) : guest.idDocumentFront ? (
                                        <>
                                            <img src={guest.idDocumentFront} alt="ID Front" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="w-4 h-4 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                                            <Upload className="w-4 h-4 text-gray-600" />
                                            <span className="text-[9px] text-gray-600 text-center">Upload Front</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                                    <span className="text-gray-400">{guest.idType || 'ID'} Front</span>
                                    {guest.idDocumentFront && <CheckCircle2 className="w-3 h-3 text-[#1db954]" />}
                                </div>
                                <input ref={frontRef} type="file" accept="image/*,application/pdf" className="hidden"
                                    onChange={e => { if (e.target.files?.[0]) handleUpload('front', e.target.files[0]) }} />
                            </div>

                            {/* Back */}
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className="relative w-28 h-20 sm:w-36 sm:h-24 bg-[#182433] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#4A9EFF]/40 transition-colors cursor-pointer group"
                                    onClick={() => backRef.current?.click()}
                                >
                                    {uploading === 'back' ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-[#4A9EFF] animate-spin" />
                                        </div>
                                    ) : guest.idDocumentBack ? (
                                        <>
                                            <img src={guest.idDocumentBack} alt="ID Back" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="w-4 h-4 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                                            <Upload className="w-4 h-4 text-gray-600" />
                                            <span className="text-[9px] text-gray-600 text-center">Upload Back</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                                    <span className="text-gray-400">{guest.idType || 'ID'} Back</span>
                                    {guest.idDocumentBack && <CheckCircle2 className="w-3 h-3 text-[#1db954]" />}
                                </div>
                                <input ref={backRef} type="file" accept="image/*,application/pdf" className="hidden"
                                    onChange={e => { if (e.target.files?.[0]) handleUpload('back', e.target.files[0]) }} />
                            </div>
                        </div>

                        {(guest.idDocumentFront || guest.idDocumentBack) && !isVerified && (
                            <button
                                onClick={handleVerify}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#1db954]/10 hover:bg-[#1db954]/20 text-[#1db954] text-[12px] font-semibold rounded-lg border border-[#1db954]/20 transition-colors"
                            >
                                <FileCheck className="w-4 h-4" /> Mark as Verified
                            </button>
                        )}
                        {isVerified && (
                            <div className="mt-3 flex items-center gap-2 text-[12px] text-[#1db954]">
                                <CheckCircle2 className="w-4 h-4" /> Documents verified
                            </div>
                        )}
                    </div>

                    {/* STAY HISTORY */}
                    <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                        <h2 className="text-[12px] sm:text-[13px] font-semibold text-white uppercase tracking-wide mb-4">Stay History</h2>
                        {bookings.length === 0 ? (
                            <p className="text-[12px] text-gray-500 text-center py-6">No bookings found</p>
                        ) : (
                            /* Horizontal scroll on mobile */
                            <div className="overflow-x-auto -mx-1">
                                <table className="w-full min-w-[480px]">
                                    <thead>
                                        <tr className="border-b border-white/[0.06]">
                                            {['ROOM', 'CHECK IN', 'CHECK OUT', 'STATUS', 'AMOUNT'].map(h => (
                                                <th key={h} className="text-left pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pr-3 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((b, i) => {
                                            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.RESERVED
                                            return (
                                                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 pr-3 text-[13px] font-bold text-white whitespace-nowrap">
                                                        {b.roomNumber}
                                                        {b.roomType && <span className="text-[10px] font-normal text-gray-500 ml-1">({b.roomType})</span>}
                                                    </td>
                                                    <td className="py-3 pr-3 text-[12px] text-gray-300 whitespace-nowrap">
                                                        {b.checkIn ? format(new Date(b.checkIn), 'MMM dd, yyyy') : '—'}
                                                    </td>
                                                    <td className="py-3 pr-3 text-[12px] text-gray-300 whitespace-nowrap">
                                                        {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : '—'}
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap', sc.cls)}>
                                                            {sc.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-[13px] font-semibold text-white whitespace-nowrap">
                                                        ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* SERVICE ORDERS */}
                    <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                        <h2 className="text-[12px] sm:text-[13px] font-semibold text-white uppercase tracking-wide mb-4">Service Orders</h2>
                        {services.length === 0 ? (
                            <p className="text-[12px] text-gray-500 text-center py-6">No service requests found</p>
                        ) : services.map((s, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 p-3 bg-[#182433] rounded-xl mb-2 last:mb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-[#233648] border border-white/[0.08] flex items-center justify-center text-base shrink-0">
                                        {s.type === 'FOOD_ORDER' ? '🍽️' : s.type === 'HOUSEKEEPING' ? '🧹' : s.type === 'LAUNDRY' ? '👕' : '🔧'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-white truncate">{s.title}</p>
                                        <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
                                            {s.createdAt ? format(new Date(s.createdAt), 'PP · h:mm a') : ''}
                                            {s.roomNumber ? ` · Room ${s.roomNumber}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    'px-2 py-0.5 text-[10px] font-semibold rounded-full border shrink-0 whitespace-nowrap',
                                    s.status === 'COMPLETED' ? 'bg-[#1db954]/10 text-[#1db954] border-[#1db954]/20' :
                                        s.status === 'PENDING' ? 'bg-[#d4aa00]/10 text-[#d4aa00] border-[#d4aa00]/20' :
                                            'bg-[#4A9EFF]/10 text-[#4A9EFF] border-[#4A9EFF]/20'
                                )}>
                                    {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR (1/3) */}
                <div className="space-y-4">

                    {/* ADMIN NOTES */}
                    <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                        <h2 className="text-[12px] sm:text-[13px] font-semibold text-white uppercase tracking-wide mb-4">Admin Notes</h2>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a private note..."
                            rows={3}
                            className="w-full p-3 bg-[#182433] border border-white/[0.08] rounded-xl text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4A9EFF]/40 resize-none transition-colors"
                        />
                        <button
                            onClick={handlePostNote}
                            disabled={!note.trim()}
                            className="mt-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-[12px] font-medium rounded-lg border border-white/[0.08] disabled:opacity-40 transition-colors"
                        >
                            Post Note
                        </button>
                        <div className="mt-4 space-y-3">
                            {notes.map((n, i) => (
                                <div key={i} className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-[#4A9EFF]/20 flex items-center justify-center text-[10px] font-bold text-[#4A9EFF] shrink-0 mt-0.5">
                                        {n.author.split(' ').map((x: string) => x[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="text-[12px] font-semibold text-white">{n.author}</span>
                                            <span className="text-[10px] text-gray-500">{n.time}</span>
                                        </div>
                                        <p className="text-[12px] text-gray-300 mt-0.5 leading-snug">{n.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GUEST PREFERENCES */}
                    <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                        <h2 className="text-[12px] sm:text-[13px] font-semibold text-white uppercase tracking-wide mb-4">Guest Preferences</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {preferences.map((p, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#182433] text-[11px] text-gray-300 rounded-full border border-white/[0.06]">
                                    {p}
                                    <button
                                        onClick={() => setPreferences(prev => prev.filter((_, j) => j !== i))}
                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPref}
                                onChange={e => setNewPref(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addPreference()}
                                placeholder="Add preference..."
                                className="flex-1 min-w-0 px-3 py-1.5 bg-[#182433] border border-white/[0.08] rounded-lg text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4A9EFF]/40 transition-colors"
                            />
                            <button
                                onClick={addPreference}
                                className="px-3 py-1.5 bg-[#4A9EFF]/10 hover:bg-[#4A9EFF]/20 text-[#4A9EFF] rounded-lg border border-[#4A9EFF]/20 transition-colors shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* ID DETAILS */}
                    <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                        <h2 className="text-[12px] sm:text-[13px] font-semibold text-white uppercase tracking-wide mb-4">ID Details</h2>
                        <div className="space-y-0">
                            {[
                                { label: 'ID Type', value: guest.idType || '—' },
                                { label: 'ID Number', value: guest.idNumber || '—' },
                                { label: 'Language', value: guest.language || '—' },
                                { label: 'Address', value: guest.address || '—' },
                                { label: 'Status', value: guest.checkInStatus || 'PENDING' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-start py-2 border-b border-white/[0.04] last:border-0 gap-2">
                                    <span className="text-[11px] text-gray-500 font-medium shrink-0">{label}</span>
                                    <span className="text-[12px] text-white font-medium text-right break-all">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── EDIT PROFILE MODAL ── */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-[#233648] border border-white/[0.1] rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-[15px] font-bold text-white">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {([
                                { key: 'name', label: 'Full Name', type: 'text' },
                                { key: 'email', label: 'Email', type: 'email' },
                                { key: 'address', label: 'Address', type: 'text' },
                            ] as const).map(field => (
                                <div key={field.key}>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={editForm[field.key] || ''}
                                        onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#182433] border border-white/[0.08] rounded-lg text-[12px] text-white focus:outline-none focus:border-[#4A9EFF]/40 transition-colors"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-2 bg-white/[0.04] text-gray-300 text-[12px] font-medium rounded-lg border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="flex-1 py-2 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white text-[12px] font-semibold rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
