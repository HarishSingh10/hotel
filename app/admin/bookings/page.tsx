'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { startOfWeek, addDays, format, differenceInDays, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Star, Download, Loader2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle2, LogOut, XCircle } from 'lucide-react'
import { downloadCSV } from '@/lib/csv'

// ---- Color/status helpers ----
const STATUS_CONFIG: Record<string, { bar: string; label: string; dot: string; text: string }> = {
  RESERVED: { bar: 'bg-[#5a5200] border-l-[3px] border-[#d4aa00]', label: 'RESERVED', dot: 'bg-[#d4aa00]', text: 'text-[#ffe066]' },
  CHECKED_IN: { bar: 'bg-[#0d3d1e] border-l-[3px] border-[#1db954]', label: 'CHECKED-IN', dot: 'bg-[#1db954]', text: 'text-[#4ade80]' },
  CHECKED_OUT: { bar: 'bg-[#1a1f2e] border-l-[3px] border-[#4a5568]', label: 'CHECKED-OUT', dot: 'bg-[#4a5568]', text: 'text-[#94a3b8]' },
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

const toLocalDateStr = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseLocal(str: string) {
    if (!str) return new Date()
    // Ensure we parse as LOCAL midnight, not UTC
    if (str.includes('T')) str = str.split('T')[0]
    return new Date(str + 'T00:00:00')
}

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

  const startDate = useMemo(() => {
    let start: Date
    if (viewMode === 'day') start = currentDate
    else start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return parseLocal(toLocalDateStr(start))
  }, [currentDate, viewMode])

  const days = useMemo(() => {
    const count = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30
    return Array.from({ length: count }).map((_, i) => addDays(startDate, i))
  }, [startDate, viewMode])

  const endDate = useMemo(() => days[days.length - 1], [days])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const roomsRes = await fetch('/api/admin/rooms?status=ALL')
      const roomsJson = await roomsRes.json()
      setRooms(Array.isArray(roomsJson) ? roomsJson : (roomsJson?.data ?? []))

      const bookingsRes = await fetch(`/api/admin/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      const bookingsJson = await bookingsRes.json()
      const bookingsData = Array.isArray(bookingsJson) ? bookingsJson : (bookingsJson?.data ?? [])

      const formatted = bookingsData.map((b: any) => ({
        id: b.id,
        guest: b.guest?.name ?? 'Guest',
        room: b.room?.roomNumber ?? '',
        startDate: parseLocal(b.checkIn),
        endDate: parseLocal(b.checkOut),
        nights: differenceInDays(parseLocal(b.checkOut), parseLocal(b.checkIn)) || 1,
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
        const err = await res.json()
        toast.error(err.error || 'Failed to update booking')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrev = () => {
    const offset = viewMode === 'day' ? -1 : viewMode === 'week' ? -7 : -30
    setCurrentDate(addDays(currentDate, offset))
  }
  const handleNext = () => {
    const offset = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30
    setCurrentDate(addDays(currentDate, offset))
  }
  const handleToday = () => setCurrentDate(new Date())

  const getBookingStyle = (booking: any) => {
    const totalDays = days.length
    const startDiff = differenceInDays(booking.startDate, startDate)
    const leftOffset = Math.max(0, startDiff)
    const visibleNights = differenceInDays(
      // Ensure we compare local midnights
      booking.endDate > endDate ? parseLocal(toLocalDateStr(addDays(endDate, 1))) : booking.endDate,
      booking.startDate < startDate ? startDate : booking.startDate
    )
    
    // Safety check for width
    const width = Math.max(0.5, Math.min(visibleNights, totalDays - leftOffset))
    
    return {
      left: `calc(${(leftOffset / totalDays) * 100}% + 2px)`,
      width: `calc(${(width / totalDays) * 100}% - 4px)`,
    }
  }

  // Unique floors derived from room data
  const floors = useMemo(() => {
    const floorNums = [...new Set(rooms.map(r => Math.floor((parseInt(r.roomNumber) || 0) / 100)))].sort()
    return floorNums.map(f => `Floor ${f}`)
  }, [rooms])

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Room Filter
      if (roomFilter !== 'All Rooms') {
        if (`Room ${room.roomNumber}` !== roomFilter) return false
      }
      // Floor Filter
      if (floorFilter !== 'All Floors') {
        const floorNum = parseInt(floorFilter.replace('Floor ', ''))
        const roomFloor = Math.floor((parseInt(room.roomNumber) || 0) / 100)
        if (roomFloor !== floorNum) return false
      }
      return true
    })
  }, [rooms, floorFilter, roomFilter])

  const monthLabel = viewMode === 'day' ? format(currentDate, 'MMMM dd, yyyy') : format(startDate, 'MMMM yyyy')

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0 bg-[#101922] text-white">
      {/* === TOP NAV BAR === */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 py-3 gap-3 border-b border-white/[0.07] bg-[#233648] shrink-0">
        {/* Left: title + Today */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col gap-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity p-1">
              <span className="w-5 h-[2px] bg-white rounded-full" />
              <span className="w-4 h-[2px] bg-white rounded-full" />
              <span className="w-5 h-[2px] bg-white rounded-full" />
            </div>
            <span className="text-base font-bold text-white uppercase tracking-tight">Calendar</span>
          </div>
          
          <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
            <button onClick={handlePrev} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <span className="text-[11px] font-black text-white min-w-[100px] text-center uppercase tracking-widest">{monthLabel}</span>
            <button onClick={handleNext} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Center/Actions: Filters and View Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4A9EFF] hover:bg-[#4A9EFF]/10 rounded-lg transition-colors border border-[#4A9EFF]/30 shrink-0"
          >
            Today
          </button>

          <div className="h-4 w-px bg-white/10 shrink-0 mx-1" />

          {/* View Toggle */}
          <div className="flex items-center bg-[#182433] border border-white/[0.1] rounded-xl p-0.5 shrink-0">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all',
                  viewMode === mode
                    ? 'bg-[#243047] text-white shadow-lg'
                    : 'text-gray-500 hover:text-white'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 shrink-0 mx-1" />

          {/* New Booking - Always visible as primary action */}
          <button
            onClick={() => window.location.href = '/admin/bookings/new'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-[#4A9EFF]/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Booking</span>
          </button>

          <button
            onClick={() => downloadCSV(bookings, 'Bookings_Export')}
            className="p-1.5 bg-[#182433] border border-white/[0.1] rounded-xl text-gray-400 hover:text-white shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* === CALENDAR GRID (Desktop) / LIST (Mobile) === */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#101922] relative">
        {/* Desktop Header */}
        <div className="hidden md:flex border-b border-white/[0.07] shrink-0 bg-[#233648]">
          <div className="w-[180px] shrink-0 flex items-center px-4 py-3 border-r border-white/[0.07]">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Inventory Hub</span>
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((day, idx) => (
              <div
                key={day.toString()}
                className={cn(
                  'py-3 px-1 text-center border-r border-white/[0.07] last:border-r-0',
                  isToday(day) ? 'bg-[#4A9EFF]/5' : '',
                  viewMode === 'month' && idx % 3 !== 0 ? 'hidden lg:block' : ''
                )}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">
                   {viewMode === 'day' ? format(day, 'EEEE') : format(day, 'EEE')}
                </p>
                <p className={cn(
                  'text-[15px] font-black inline-flex w-7 h-7 items-center justify-center rounded-lg transition-all',
                  isToday(day) ? 'bg-[#4A9EFF] text-white shadow-lg' : 'text-white'
                )}>{format(day, 'd')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Rows */}
        <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : filteredRooms.map((room, idx) => {
              const roomBookings = bookings.filter(b => b.room === room.roomNumber)
              const statusCfg = ROOM_STATUS_CONFIG[room.status || 'CLEAN'] || ROOM_STATUS_CONFIG['CLEAN']
              return (
                <div key={room.id} className={cn('flex border-b border-white/[0.05] h-[80px] group transition-colors', idx % 2 === 0 ? 'bg-[#101922]' : 'bg-[#141d28]', 'hover:bg-white/[0.02]')}>
                  <div className="w-[180px] shrink-0 px-4 flex flex-col justify-center border-r border-white/[0.07] gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">{room.roomNumber}</span>
                      <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md', statusCfg.cls)}>{statusCfg.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 capitalize tracking-tight">{(room.type || 'standard').replace('_', ' ')}</span>
                  </div>
                  <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                    {days.map(day => (
                      <div key={day.toString()} className={cn('border-r border-white/[0.04] last:border-r-0 h-full', isToday(day) ? 'bg-blue-400/[0.02]' : '')} />
                    ))}
                    {roomBookings.map(booking => {
                      if (differenceInDays(booking.startDate, endDate) > 0 || differenceInDays(booking.endDate, startDate) < 0) return null
                      const cfg = getStatusConfig(booking.status)
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={cn('absolute top-[12px] bottom-[12px] rounded-lg cursor-pointer transition-all z-10 flex flex-col justify-center px-3 overflow-hidden shadow-xl border-l-4', cfg.bar)}
                          style={getBookingStyle(booking)}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{booking.guest}</p>
                            {booking.isVip && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <p className={cn('text-[9px] font-black uppercase tracking-widest', cfg.text)}>
                            {cfg.label} • {booking.nights}N
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
          })}
        </div>

        {/* Mobile View: Vertical Booking List */}
        <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar bg-[#0d1117]">
          {loading ? (
             <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : bookings.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 opacity-30 gap-3">
                <Calendar className="w-12 h-12" />
                <p className="text-sm font-black uppercase tracking-widest">No Bookings this week</p>
             </div>
          ) : (
            <div className="p-4 space-y-4">
               <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Current Week Schedule</h3>
               {bookings.sort((a,b) => a.startDate.getTime() - b.startDate.getTime()).map(booking => {
                 const cfg = getStatusConfig(booking.status)
                 return (
                   <div 
                     key={booking.id}
                     onClick={() => setSelectedBooking(booking)}
                     className={cn("p-4 rounded-2xl border transition-all active:scale-[0.98] relative overflow-hidden", cfg.bar)}
                   >
                      <div className="flex items-start justify-between mb-3">
                         <div>
                            <p className="text-[15px] font-black text-white leading-tight mb-1">{booking.guest}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">ROOM {booking.room}</span>
                               <span className={cn("text-[10px] font-black uppercase tracking-widest", cfg.text)}>{cfg.label}</span>
                            </div>
                         </div>
                         {booking.isVip && <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /></div>}
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-black/20 rounded-xl p-3 border border-white/5">
                         <div>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-in</p>
                            <p className="text-[12px] font-bold text-white">{format(booking.startDate, 'MMM dd, EEE')}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-out</p>
                            <p className="text-[12px] font-bold text-white">{format(booking.endDate, 'MMM dd, EEE')}</p>
                         </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{booking.nights} Nights Stay</span>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{booking.source}</span>
                      </div>
                   </div>
                 )
               })}
            </div>
          )}
        </div>
      </div>

      {/* === LEGEND === */}
      <div className="flex items-center justify-center gap-4 md:gap-8 py-4 px-4 border-t border-white/[0.07] bg-[#233648] shrink-0 flex-wrap">
        {LEGEND.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={cn('w-2.5 h-2.5 rounded-full shadow-lg shadow-black/20', item.cls)} />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
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
                  {selectedBooking.status !== 'CHECKED_OUT' && selectedBooking.status !== 'CANCELLED' && (
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

