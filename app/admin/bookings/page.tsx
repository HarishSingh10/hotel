'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { startOfWeek, addDays, format, differenceInDays, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Star, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle2, LogOut, XCircle } from 'lucide-react'
import { downloadCSV } from '@/lib/csv'

// ---- Color/status helpers ----
const STATUS_CONFIG: Record<string, { bar: string; label: string; dot: string; text: string }> = {
  RESERVED: { bar: 'bg-[#5a5200] border-l-[3px] border-[#d4aa00]', label: 'RESERVED', dot: 'bg-[#d4aa00]', text: 'text-[#ffe066]' },
  CHECKED_IN: { bar: 'bg-[#0d3d1e] border-l-[3px] border-[#1db954]', label: 'CHECKED-IN', dot: 'bg-[#1db954]', text: 'text-[#4ade80]' },
  COMPLETED: { bar: 'bg-[#1a1f2e] border-l-[3px] border-[#4a5568]', label: 'CHECKED-OUT', dot: 'bg-[#4a5568]', text: 'text-[#94a3b8]' },
  CANCELLED: { bar: 'bg-[#3d0d0d] border-l-[3px] border-[#e53e3e]', label: 'CANCELLED', dot: 'bg-[#e53e3e]', text: 'text-[#fc8181]' },
  AIRBNB: { bar: 'bg-[#2d1a47] border-l-[3px] border-[#805ad5]', label: 'AIRBNB', dot: 'bg-[#805ad5]', text: 'text-[#c084fc]' },
  DIRECT: { bar: 'bg-[#1a3a5c] border-l-[3px] border-[#3b82f6]', label: 'DIRECT', dot: 'bg-[#3b82f6]', text: 'text-[#60a5fa]' },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG['RESERVED']
}

const ROOM_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  CLEAN: { label: 'Clean', cls: 'bg-[#0d3d1e] text-[#4ade80] border border-[#1db954]/30' },
  DIRTY: { label: 'Dirty', cls: 'bg-[#3d0d0d] text-[#fc8181] border border-[#e53e3e]/30' },
  INSPECT: { label: 'Inspect', cls: 'bg-[#3d2800] text-[#fbbf24] border border-[#f59e0b]/30' },
}

const LEGEND = [
  { label: 'Reserved', cls: 'bg-[#d4aa00]' },
  { label: 'Checked-in', cls: 'bg-[#1db954]' },
  { label: 'Checked-out', cls: 'bg-[#4a5568]' },
  { label: 'Cancelled', cls: 'bg-[#e53e3e]' },
  { label: 'Block/OTA', cls: 'bg-[#805ad5]' },
]

export default function BookingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [rooms, setRooms] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [roomFilter, setRoomFilter] = useState('All Rooms')
  const [floorFilter, setFloorFilter] = useState('All Floors')

  const startDate = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)), [startDate])
  const endDate = useMemo(() => days[6], [days])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const roomsRes = await fetch('/api/admin/rooms?status=ALL')
      const roomsData = await roomsRes.json()
      setRooms(Array.isArray(roomsData) ? roomsData : [])

      const bookingsRes = await fetch(`/api/admin/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      const bookingsData = await bookingsRes.json()

      const formatted = (Array.isArray(bookingsData) ? bookingsData : []).map((b: any) => ({
        id: b.id,
        guest: b.guest?.name ?? 'Guest',
        room: b.room?.roomNumber ?? '',
        startDate: new Date(b.checkIn),
        endDate: new Date(b.checkOut),
        nights: differenceInDays(new Date(b.checkOut), new Date(b.checkIn)),
        status: b.status,
        source: b.source ?? '',
        isVip: b.isVip ?? false,
      }))
      setBookings(formatted)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateStatus = async (action: string) => {
    if (!selectedBooking) return
    setIsUpdating(true)
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBooking.id, action })
      })
      if (res.ok) {
        toast.success(`Booking ${action.replace('_', ' ').toLowerCase()} successfully`)
        setSelectedBooking(null)
        fetchData()
      } else {
        toast.error('Failed to update booking')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7))
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7))
  const handleToday = () => setCurrentDate(new Date())

  const getBookingStyle = (booking: any) => {
    const startDiff = differenceInDays(booking.startDate, startDate)
    const leftOffset = Math.max(0, startDiff)
    const width = Math.min(booking.nights, 7 - leftOffset)
    return {
      left: `calc(${(leftOffset / 7) * 100}% + 2px)`,
      width: `calc(${(width / 7) * 100}% - 4px)`,
    }
  }

  // Unique floors derived from room data
  const floors = useMemo(() => {
    const floorNums = [...new Set(rooms.map(r => Math.floor((parseInt(r.roomNumber) || 0) / 100)))].sort()
    return floorNums.map(f => `Floor ${f}`)
  }, [rooms])

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (floorFilter !== 'All Floors') {
        const floorNum = parseInt(floorFilter.replace('Floor ', ''))
        const roomFloor = Math.floor((parseInt(room.roomNumber) || 0) / 100)
        if (roomFloor !== floorNum) return false
      }
      return true
    })
  }, [rooms, floorFilter])

  const monthLabel = format(startDate, 'MMMM yyyy')

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0 bg-[#101922] text-white">
      {/* === TOP NAV BAR === */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#233648] shrink-0">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity p-1">
            <span className="w-5 h-[2px] bg-white rounded-full" />
            <span className="w-4 h-[2px] bg-white rounded-full" />
            <span className="w-5 h-[2px] bg-white rounded-full" />
          </div>
          <span className="text-base font-semibold text-white">Calendar</span>
        </div>

        {/* Center: nav + today + filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-sm font-medium text-white min-w-[120px] text-center">{monthLabel}</span>
          <button
            onClick={handleNextWeek}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-medium text-[#4A9EFF] hover:bg-[#4A9EFF]/10 rounded-md transition-colors border border-[#4A9EFF]/30"
          >
            Today
          </button>

          {/* Room Filter */}
          <select
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#182433] border border-white/[0.1] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#4A9EFF]/50 cursor-pointer"
          >
            <option>All Rooms</option>
            {rooms.map(r => <option key={r.id}>Room {r.roomNumber}</option>)}
          </select>

          {/* Floor Filter */}
          <select
            value={floorFilter}
            onChange={e => setFloorFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#182433] border border-white/[0.1] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#4A9EFF]/50 cursor-pointer"
          >
            <option>All Floors</option>
            {floors.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        {/* Right: view toggle + new booking */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#182433] border border-white/[0.1] rounded-lg p-0.5">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all',
                  viewMode === mode
                    ? 'bg-[#243047] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.location.href = '/admin/bookings/new'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-[#4A9EFF]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Booking
          </button>
          <button
            onClick={() => downloadCSV(bookings.map(b => ({
              Guest: b.guest,
              Room: b.room,
              CheckIn: format(b.startDate, 'dd-MM-yyyy'),
              CheckOut: format(b.endDate, 'dd-MM-yyyy'),
              Nights: b.nights,
              Status: b.status
            })), 'Bookings_Report')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182433] hover:bg-[#243047] text-gray-300 text-xs font-medium rounded-lg border border-white/[0.1] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* === CALENDAR GRID === */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#101922]">
        {/* Column Headers */}
        <div className="flex border-b border-white/[0.07] shrink-0 bg-[#233648]">
          {/* Room label column */}
          <div className="w-[200px] shrink-0 flex items-center px-4 py-2 border-r border-white/[0.07]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Rooms</span>
          </div>
          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7">
            {days.map(day => {
              const today = isToday(day)
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'py-2 px-1 text-center border-r border-white/[0.07] last:border-r-0',
                    today ? 'bg-[#4A9EFF]/5' : ''
                  )}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn(
                    'text-sm font-bold inline-flex w-6 h-6 items-center justify-center rounded-full mx-auto',
                    today
                      ? 'bg-[#4A9EFF] text-white text-xs'
                      : 'text-white'
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Room Rows */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading schedule...</p>
              </div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-gray-500">No rooms found</p>
            </div>
          ) : (
            filteredRooms.map((room, idx) => {
              const roomBookings = bookings.filter(b => b.room === room.roomNumber)
              const roomStatus = room.status || 'CLEAN'
              const statusCfg = ROOM_STATUS_CONFIG[roomStatus] || ROOM_STATUS_CONFIG['CLEAN']

              return (
                <div
                  key={room.id}
                  className={cn(
                    'flex border-b border-white/[0.05] h-[76px] group transition-colors',
                    idx % 2 === 0 ? 'bg-[#101922]' : 'bg-[#141d28]',
                    'hover:bg-[#182433]/40'
                  )}
                >
                  {/* Room Info */}
                  <div className="w-[200px] shrink-0 px-4 flex flex-col justify-center border-r border-white/[0.07] gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{room.roomNumber}</span>
                      <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-md', statusCfg.cls)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 leading-tight">
                      {room.type ? room.type.replace('_', ' ') : 'Standard'}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 grid grid-cols-7 relative">
                    {days.map(day => (
                      <div
                        key={day.toString()}
                        className={cn(
                          'border-r border-white/[0.05] last:border-r-0 h-full',
                          isToday(day) ? 'bg-[#4A9EFF]/[0.03]' : ''
                        )}
                      />
                    ))}

                    {/* Booking bars */}
                    {roomBookings.map(booking => {
                      if (differenceInDays(booking.startDate, endDate) > 0) return null
                      if (differenceInDays(booking.endDate, startDate) < 0) return null

                      const cfg = getStatusConfig(booking.status)
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={cn(
                            'absolute top-[10px] bottom-[10px] rounded-md cursor-pointer transition-all',
                            'hover:brightness-110 hover:scale-y-105 hover:z-20',
                            'flex flex-col justify-center px-2 overflow-hidden z-10',
                            cfg.bar
                          )}
                          style={getBookingStyle(booking)}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-semibold text-white truncate">{booking.guest}</p>
                            {booking.isVip && <Star className="w-2.5 h-2.5 text-[#d4aa00] shrink-0 fill-[#d4aa00]" />}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={cn('text-[9px] font-bold uppercase tracking-wide', cfg.text)}>
                              {cfg.label}
                            </span>
                            <span className="text-[9px] text-gray-400">• {booking.nights} Night{booking.nights !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* === LEGEND === */}
      <div className="flex items-center justify-center gap-6 py-2.5 px-4 border-t border-white/[0.07] bg-[#233648] shrink-0">
        {LEGEND.map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded-sm', item.cls)} />
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>

      {/* === BOOKING DETAIL MODAL === */}
      {selectedBooking && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/70"
            onClick={() => setSelectedBooking(null)}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-[#233648] border border-white/[0.1] rounded-2xl shadow-2xl pointer-events-auto animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-base font-bold text-white">Booking Details</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage reservation for {selectedBooking.guest}</p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#182433] rounded-xl">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Guest</p>
                    <p className="text-sm font-semibold text-white">{selectedBooking.guest}</p>
                  </div>
                  <div className="p-3 bg-[#182433] rounded-xl">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Room</p>
                    <p className="text-sm font-semibold text-white">{selectedBooking.room}</p>
                  </div>
                  <div className="p-3 bg-[#182433] rounded-xl">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Check-In</p>
                    <p className="text-sm font-semibold text-white">{format(selectedBooking.startDate, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="p-3 bg-[#182433] rounded-xl">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Check-Out</p>
                    <p className="text-sm font-semibold text-white">{format(selectedBooking.endDate, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="p-3 bg-[#182433] rounded-xl">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Nights</p>
                    <p className="text-sm font-semibold text-white">{selectedBooking.nights}</p>
                  </div>
                  <div className="p-3 bg-[#182433] rounded-xl">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Status</p>
                    <span className={cn(
                      'text-xs font-bold uppercase',
                      getStatusConfig(selectedBooking.status).text
                    )}>
                      {getStatusConfig(selectedBooking.status).label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {selectedBooking.status === 'RESERVED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus('CHECK_IN')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1db954] hover:bg-[#17a349] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isUpdating ? 'Updating...' : 'Check In Guest'}
                    </button>
                  )}
                  {selectedBooking.status === 'CHECKED_IN' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus('CHECK_OUT')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {isUpdating ? 'Updating...' : 'Check Out Guest'}
                    </button>
                  )}
                  {selectedBooking.status !== 'COMPLETED' && selectedBooking.status !== 'CANCELLED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus('CANCEL')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1a1f2e] hover:bg-[#3d0d0d] text-[#fc8181] hover:text-white text-sm font-semibold rounded-xl border border-[#e53e3e]/30 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

