'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Plus, Download, Search, CheckCircle2, Clock,
  ChevronLeft, ChevronRight, Calendar, SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

/* ---- helpers ---- */
function getInitials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
}
const AVATAR_COLORS = [
  'bg-[#4A9EFF]', 'bg-[#1db954]', 'bg-[#805ad5]', 'bg-[#d4aa00]', 'bg-[#e53e3e]', 'bg-[#ed8936]',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Direct', BOOKING_COM: 'Booking.com', MAKE_MY_TRIP: 'MakeMyTrip',
  AGODA: 'Agoda', EXPEDIA: 'Expedia', AIRBNB: 'Airbnb', WALK_IN: 'Walk-in', OTHER: 'Other',
}
const SOURCE_ICON: Record<string, string> = {
  BOOKING_COM: 'B', EXPEDIA: 'E', AIRBNB: 'A', AGODA: 'AG', MAKE_MY_TRIP: 'MMT', DIRECT: 'D', WALK_IN: 'W',
}

const PAGE_SIZE = 10

function GuestsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('ALL')
  const [sourceFilter, setSource] = useState('ALL')
  const [idFilter, setIdFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    name: '', phone: '', email: '', idType: '', idNumber: '', address: '',
  })

  const fetchGuests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/guests')
      if (res.ok) {
        const data = await res.json()
        setGuests(data.map((d: any) => ({
          ...d,
          checkIn: d.checkIn ? new Date(d.checkIn) : null,
          checkOut: d.checkOut ? new Date(d.checkOut) : null,
        })))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGuests() }, [])
  useEffect(() => {
    if (searchParams.get('addNew') === 'true') {
      setShowAdd(true)
      router.replace('/admin/guests')
    }
  }, [searchParams])

  // Filtered
  const filtered = guests.filter(g => {
    const q = search.toLowerCase()
    const matchSearch = g.name.toLowerCase().includes(q) ||
      g.phone.includes(q) || (g.email || '').toLowerCase().includes(q) ||
      (g.roomNumber || '').includes(q)
    const matchStatus = statusFilter === 'ALL' || g.status === statusFilter
    const matchSource = sourceFilter === 'ALL' || g.source === sourceFilter
    const matchId = idFilter === 'ALL' ||
      (idFilter === 'VERIFIED' && g.idVerified) ||
      (idFilter === 'PENDING' && !g.idVerified)
    return matchSearch && matchStatus && matchSource && matchId
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const handleSelectAll = () => {
    if (selected.size === pageItems.length) setSelected(new Set())
    else setSelected(new Set(pageItems.map(g => g.id)))
  }

  const handleAddGuest = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    try {
      const res = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Guest added successfully')
        setShowAdd(false)
        setForm({ name: '', phone: '', email: '', idType: '', idNumber: '', address: '' })
        fetchGuests()
      } else {
        toast.error(await res.text())
      }
    } catch { toast.error('Something went wrong') }
  }

  const handleExport = () => toast.success('Exporting guest list...')

  return (
    <div className="space-y-5 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Guest Management</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Manage current, past, and future guests</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-lg shadow-[#4A9EFF]/20"
        >
          <Plus className="w-4 h-4" /> Add New Guest
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by guest name, room, or confirmation..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 bg-[#233648] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4A9EFF]/40 transition-colors"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#233648] border border-white/[0.08] rounded-lg text-[13px] text-gray-300 focus:outline-none focus:border-[#4A9EFF]/40 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="RESERVED">Reserved</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Source */}
        <select
          value={sourceFilter}
          onChange={e => { setSource(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#233648] border border-white/[0.08] rounded-lg text-[13px] text-gray-300 focus:outline-none focus:border-[#4A9EFF]/40 cursor-pointer"
        >
          <option value="ALL">All Sources</option>
          <option value="DIRECT">Direct</option>
          <option value="BOOKING_COM">Booking.com</option>
          <option value="AIRBNB">Airbnb</option>
          <option value="EXPEDIA">Expedia</option>
          <option value="AGODA">Agoda</option>
          <option value="MAKE_MY_TRIP">MakeMyTrip</option>
          <option value="WALK_IN">Walk-in</option>
        </select>

        {/* ID Status */}
        <select
          value={idFilter}
          onChange={e => { setIdFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-[#233648] border border-white/[0.08] rounded-lg text-[13px] text-gray-300 focus:outline-none focus:border-[#4A9EFF]/40 cursor-pointer"
        >
          <option value="ALL">ID Status: All</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
        </select>

        {/* Date range placeholder */}
        <button className="flex items-center gap-2 px-3 py-2 bg-[#233648] border border-white/[0.08] rounded-lg text-[13px] text-gray-400 hover:text-white hover:border-white/[0.15] transition-colors">
          <Calendar className="w-3.5 h-3.5" /> Select Dates
        </button>

        <button
          onClick={handleExport}
          className="ml-auto flex items-center gap-2 px-3 py-2 bg-[#233648] border border-white/[0.08] rounded-lg text-[13px] text-gray-400 hover:text-white hover:border-white/[0.15] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[#233648] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2rem_1fr_80px_120px_120px_100px_140px_140px] gap-3 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selected.size === pageItems.length && pageItems.length > 0}
              onChange={handleSelectAll}
              className="w-3.5 h-3.5 accent-[#4A9EFF] cursor-pointer"
            />
          </div>
          {['GUEST NAME', 'ROOM', 'CHECK-IN', 'CHECK-OUT', 'PAX', 'ID STATUS', 'SOURCE'].map(h => (
            <span key={h} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-[13px] text-gray-500">No guests found</p>
          </div>
        ) : pageItems.map(guest => (
          <div
            key={guest.id}
            onClick={() => router.push(`/admin/guests/${guest.id}`)}
            className="grid grid-cols-[2rem_1fr_80px_120px_120px_100px_140px_140px] gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors group"
          >
            {/* Checkbox */}
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selected.has(guest.id)}
                onChange={() => handleSelect(guest.id)}
                className="w-3.5 h-3.5 accent-[#4A9EFF] cursor-pointer"
              />
            </div>

            {/* Guest Name + Phone */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white', avatarColor(guest.name))}>
                {getInitials(guest.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{guest.name}</p>
                <p className="text-[10px] text-gray-500">+{guest.phone}</p>
              </div>
            </div>

            {/* Room */}
            <p className="flex items-center text-[13px] font-bold text-white">{guest.roomNumber || '—'}</p>

            {/* Check-in */}
            <div className="flex flex-col justify-center">
              <p className="text-[12px] text-white">{guest.checkIn ? format(new Date(guest.checkIn), 'MMM dd,') : '—'}</p>
              <p className="text-[11px] text-gray-500">{guest.checkIn ? format(new Date(guest.checkIn), 'yyyy') : ''}</p>
            </div>

            {/* Check-out */}
            <div className="flex flex-col justify-center">
              <p className="text-[12px] text-white">{guest.checkOut ? format(new Date(guest.checkOut), 'MMM dd,') : '—'}</p>
              <p className="text-[11px] text-gray-500">{guest.checkOut ? format(new Date(guest.checkOut), 'yyyy') : ''}</p>
            </div>

            {/* PAX */}
            <p className="flex items-center text-[12px] text-white">
              {guest.guestCount || 1} {(guest.guestCount || 1) === 1 ? 'Adult' : 'Adults'}
            </p>

            {/* ID Status */}
            <div className="flex items-center">
              {guest.idVerified ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1db954]/10 text-[#1db954] text-[11px] font-semibold rounded-full border border-[#1db954]/20">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#d4aa00]/10 text-[#d4aa00] text-[11px] font-semibold rounded-full border border-[#d4aa00]/20">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              )}
            </div>

            {/* Source */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#182433] border border-white/[0.08] flex items-center justify-center text-[8px] font-black text-gray-400">
                {SOURCE_ICON[guest.source] || '?'}
              </div>
              <span className="text-[12px] text-gray-300">{SOURCE_LABELS[guest.source] || guest.source}</span>
            </div>
          </div>
        ))}

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <p className="text-[12px] text-gray-500">
            Showing <span className="font-semibold text-white">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
            <span className="font-semibold text-white">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{' '}
            <span className="font-semibold text-white">{filtered.length}</span> guests
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-white bg-[#182433] hover:bg-[#202e40] rounded-lg border border-white/[0.06] disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-8 h-8 text-[12px] font-medium rounded-lg border transition-colors',
                  page === p
                    ? 'bg-[#4A9EFF] text-white border-[#4A9EFF]'
                    : 'text-gray-400 hover:text-white bg-[#182433] hover:bg-[#202e40] border-white/[0.06]'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-white bg-[#182433] hover:bg-[#202e40] rounded-lg border border-white/[0.06] disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD GUEST MODAL */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Guest" description="Create a new guest profile manually">
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" placeholder="Enter full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input label="Phone" type="tel" placeholder="10-digit mobile" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <Input label="Email" type="email" placeholder="guest@example.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" placeholder="Full address" value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="ID Type" value={form.idType}
              onChange={e => setForm({ ...form, idType: e.target.value })}
              options={[
                { value: '', label: 'Select ID type' },
                { value: 'AADHAAR', label: 'Aadhaar Card' },
                { value: 'PASSPORT', label: 'Passport' },
                { value: 'DRIVING_LICENSE', label: 'Driving License' },
                { value: 'VOTER_ID', label: 'Voter ID' },
              ]}
            />
            <Input label="ID Number" placeholder="Enter ID number" value={form.idNumber}
              onChange={e => setForm({ ...form, idNumber: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddGuest}>Add Guest</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function GuestsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-gray-500 animate-pulse">Loading guests...</div>
    }>
      <GuestsContent />
    </Suspense>
  )
}
