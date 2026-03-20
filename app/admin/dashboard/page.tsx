'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { buildContextUrl as bcu, isGlobalContext as igc } from '@/lib/admin-context'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Avatar from '@/components/common/Avatar'
import { cn, formatCurrency } from '@/lib/utils'
import {
  LogIn, LogOut, BedDouble, Plus, Bell, Search, Send, MoreHorizontal, MessageSquare, Sparkles, BarChart3
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session } = useSession()

  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [todayReservations, setTodayReservations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceForm, setServiceForm] = useState({
    roomId: '', type: 'HOUSEKEEPING', title: '', description: '', priority: 'NORMAL',
  })

  const requireHotel = (actionName = 'this action') => {
    if (session?.user?.role !== 'SUPER_ADMIN') return false
    if (igc()) {
      toast.error('Please select a hotel first', {
        description: `"${actionName}" requires a specific hotel.`,
      })
      return true
    }
    return false
  }

  const { data: stats, isLoading: loading, mutate: fetchStats } = useSWR(
    session ? bcu('/api/admin/dashboard') : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 } // Auto-refresh every minute
  )

  const fetchRooms = async () => {
    try {
      const res = await fetch(bcu('/api/admin/rooms', { status: 'ALL' }))
      if (res.ok) setRooms(await res.json())
    } catch { }
  }

  const fetchReservations = async () => {
    try {
      const today = new Date()
      const start = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const end = new Date(today.setHours(23, 59, 59, 999)).toISOString()
      const res = await fetch(bcu('/api/admin/bookings', { start, end }))
      if (res.ok) {
        const data = await res.json()
        setTodayReservations(data.filter((b: any) => b.status === 'RESERVED'))
      }
    } catch { }
  }

  const handleRaiseService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceForm.roomId || !serviceForm.title) { toast.error('Please fill in required fields'); return }
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      })
      if (res.ok) {
        toast.success('Service ticket raised')
        setShowServiceModal(false)
        setServiceForm({ roomId: '', type: 'HOUSEKEEPING', title: '', description: '', priority: 'NORMAL' })
      } else toast.error('Failed to raise ticket')
    } catch { toast.error('Something went wrong') }
  }

  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'CHECK_IN' }),
      })
      if (res.ok) {
        toast.success('Guest checked in')
        setShowCheckInModal(false)
        fetchStats()
      } else toast.error('Failed to check in')
    } catch { toast.error('Something went wrong') }
  }

  const handleCheckOut = async (bookingId: string) => {
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'CHECK_OUT' }),
      })
      if (res.ok) { toast.success('Guest checked out'); fetchStats() }
      else toast.error('Failed to check out')
    } catch { toast.error('Something went wrong') }
  }

  useEffect(() => { if (session) fetchStats() }, [session])

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      CHECKED_IN: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Checked In' },
      RESERVED: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Pending' },
      CHECKED_OUT: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Checked Out' },
    }
    const s = map[status] || map.RESERVED
    return (
      <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold', s.bg, s.text)}>
        {s.label}
      </span>
    )
  }

  if (loading || !stats) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-[#233648] rounded-xl animate-pulse border border-white/[0.05]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-4">
          <div className="h-96 bg-[#233648] rounded-xl animate-pulse border border-white/[0.05]" />
          <div className="h-96 bg-[#233648] rounded-xl animate-pulse border border-white/[0.05]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ===== 4 KPI CARDS ===== */}
      {/* ===== 5 KPI CARDS ===== */}
      <div data-tour="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#233648] to-[#1a2b3c] border border-white/[0.08] rounded-2xl p-5 hover:border-[#4A9EFF]/30 transition-all group group-hover:shadow-2xl shadow-[#4A9EFF]/5">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#4A9EFF]/5 rounded-full blur-2xl group-hover:bg-[#4A9EFF]/10 transition-all" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Today Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mb-1 tracking-tight">{formatCurrency(stats.todayRevenue || 0)}</p>
          <div className="flex items-center gap-1.5 mt-2">
             <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">LIVE</span>
             <p className="text-[10px] text-gray-500 font-medium tracking-wide">Update 1m ago</p>
          </div>
        </div>

        {/* Month Revenue */}
        <div className="bg-[#233648] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all hover:scale-[1.02]">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">MTD Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mb-1 tracking-tight">{formatCurrency(stats.monthRevenue || 0)}</p>
          <p className="text-[10px] text-gray-500 font-medium">Month to date performance</p>
        </div>

        {/* Occupancy */}
        <div className="bg-[#233648] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Occupancy</p>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <BedDouble className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <p className="text-2xl font-black text-white">{stats.occupancyRate}%</p>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
              stats.occupancyTrend?.startsWith('+') ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
            )}>
              {stats.occupancyTrend}
            </span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mt-3">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }} />
          </div>
        </div>

        {/* Today Check-ins */}
        <div className="bg-[#233648] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Arrivals Today</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <LogIn className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mb-1 tracking-tight">{stats.todayCheckIns}</p>
          <p className="text-[10px] text-emerald-400 font-bold">{stats.pendingArrivals} Pending verification</p>
        </div>

        {/* Today Check-outs */}
        <div className="bg-[#233648] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Departures</p>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <LogOut className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mb-1 tracking-tight">{stats.todayCheckOuts}</p>
          <p className="text-[10px] text-gray-500 font-medium">{stats.remainingDepartures} Rooms still occupied</p>
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-4">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Today's Arrivals Table */}
          <div className="bg-[#233648] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-[14px] font-semibold text-white">Today&apos;s Arrivals</h2>
              </div>
              <button onClick={() => router.push('/admin/bookings')} className="text-[12px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-t border-white/[0.06]">
                    {['GUEST NAME', 'ROOM TYPE', 'ETA', 'STATUS', 'ACTION'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCheckIns?.length > 0 ? stats.recentCheckIns.map((g: any) => (
                    <tr key={g.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={g.guest} size="sm" src={g.guestAvatar} />
                          <div>
                            <p className="text-[13px] font-bold text-white leading-none">{g.guest}</p>
                            <p className="text-[10px] text-gray-500 mt-1 font-medium">{g.guestId || 'GUEST-001'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] text-gray-200 font-medium">{g.roomType}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Base Rate Applied</p>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-gray-400 font-medium">{g.eta}</td>
                      <td className="px-5 py-4">{statusBadge(g.status)}</td>
                      <td className="px-5 py-4">
                        {g.status === 'RESERVED' ? (
                          <button onClick={() => handleCheckIn(g.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[11px] font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                            <LogIn size={12} /> Check-in
                          </button>
                        ) : (
                          <button className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center py-8 text-[13px] text-gray-500">No arrivals today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Housekeeping Status */}
          <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-blue-400" />
                <h2 className="text-[14px] font-semibold text-white">Housekeeping Status</h2>
              </div>
              <p className="text-[11px] text-gray-600">Last updated: just now</p>
            </div>

            {/* 3 Status Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#182433] rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <BedDouble className="w-3.5 h-3.5 text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats.housekeeping?.dirty || 0}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Dirty Rooms</p>
              </div>
              <div className="bg-[#182433] rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <BedDouble className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats.housekeeping?.inProgress || 0}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">In Progress</p>
              </div>
              <div className="bg-[#182433] rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats.housekeeping?.clean || 0}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Clean & Ready</p>
              </div>
            </div>

            {/* Priority Cleaning */}
            {stats.housekeeping?.priority?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Priority Cleaning</p>
                {stats.housekeeping.priority.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-[#182433] rounded-lg border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-white">Room {p.room}</span>
                      <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-[10px] font-semibold rounded-full">{p.status === 'PENDING' ? 'Checked Out' : 'In Progress'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar name={p.assignedTo} />
                      <span className="text-[11px] text-gray-400">Assigned to: {p.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div data-tour="quick-actions" className="bg-[#233648] border border-white/[0.07] rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-white mb-4">Quick Actions</h2>
            <Button
              onClick={() => { if (requireHotel('New Booking')) return; router.push('/admin/bookings/new') }}
              className="w-full py-3.5 mb-4 shadow-lg shadow-[#4A9EFF]/20"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Walk-in Booking
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <button
                data-tour="guest-checkin"
                onClick={() => { if (requireHotel('Send Check-in Link')) return; toast.info('Check-in link feature coming soon!') }}
                className="flex flex-col items-center gap-2 p-4 bg-[#182433] hover:bg-[#202e40] border border-white/[0.06] rounded-xl transition-all active:scale-95"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Send className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-[11px] font-medium text-gray-300 text-center">Send Check-in Link</span>
              </button>
              <button
                data-tour="raise-service"
                onClick={() => { if (requireHotel('Add Service Request')) return; setShowServiceModal(true); fetchRooms() }}
                className="flex flex-col items-center gap-2 p-4 bg-[#182433] hover:bg-[#202e40] border border-white/[0.06] rounded-xl transition-all active:scale-95"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-[11px] font-medium text-gray-300 text-center">Add Service Request</span>
              </button>
            </div>
          </div>

          {/* On-Duty Staff */}
          <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-white">On-Duty Staff</h2>
              <button className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {stats.onDutyStaffDetails?.length > 0 ? stats.onDutyStaffDetails.map((staff: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={staff.name} />
                    <div>
                      <p className="text-[13px] font-semibold text-white">{staff.name}</p>
                      <p className="text-[11px] text-gray-500 capitalize">{staff.department}</p>
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-blue-400 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <div className="py-5 text-center border border-dashed border-white/[0.08] rounded-xl">
                  <p className="text-[11px] text-gray-600">No staff currently clocked in</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#233648] border border-white/[0.07] rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {stats.activityLog?.length > 0 ? stats.activityLog.map((log: any, i: number) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[7px] shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">{log.time}</p>
                    <p className="text-[12px] text-white leading-snug mt-0.5">{log.action}</p>
                  </div>
                </div>
              )) : (
                <div className="py-5 text-center border border-dashed border-white/[0.08] rounded-xl">
                  <p className="text-[11px] text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== EXPRESS CHECK-IN MODAL ===== */}
      <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Express Check-in" description="Quickly check-in guests with reservations for today">
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search guest name..." className="w-full pl-10 pr-4 py-2 bg-[#182433] border border-white/[0.1] rounded-lg text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#4A9EFF]/50 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {todayReservations.filter(b => b.guest?.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(booking => (
              <div key={booking.id} className="p-4 bg-[#182433] rounded-xl border border-white/[0.06] flex items-center justify-between group hover:border-[#4A9EFF]/30 transition-all">
                <div>
                  <p className="text-sm font-semibold text-white">{booking.guest.name}</p>
                  <p className="text-[11px] text-gray-500">Room {booking.room?.roomNumber} · {booking.source}</p>
                </div>
                <button onClick={() => handleCheckIn(booking.id)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-[#4A9EFF] text-white text-[12px] font-semibold rounded-lg transition-all">Check-in</button>
              </div>
            ))}
            {todayReservations.length === 0 && <p className="text-center py-8 text-sm text-gray-500">No pending reservations.</p>}
          </div>
        </div>
      </Modal>

      {/* ===== RAISE SERVICE MODAL ===== */}
      <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title="Raise Service Ticket" description="Create a new housekeeping or maintenance request">
        <form onSubmit={handleRaiseService} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Target Room" value={serviceForm.roomId} onChange={(e) => setServiceForm({ ...serviceForm, roomId: e.target.value })} options={[{ value: '', label: 'Select Room' }, ...rooms.map(r => ({ value: r.id, label: `Room ${r.roomNumber}` }))]} required />
            <Select label="Ticket Type" value={serviceForm.type} onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })} options={[
              { value: 'HOUSEKEEPING', label: 'Housekeeping' }, { value: 'MAINTENANCE', label: 'Maintenance' },
              { value: 'ROOM_SERVICE', label: 'Room Service' }, { value: 'FOOD_ORDER', label: 'Food & Beverage' },
              { value: 'LAUNDRY', label: 'Laundry' }, { value: 'CONCIERGE', label: 'Concierge' },
            ]} />
          </div>
          <Input label="Title" value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} placeholder="e.g. AC not working" required />
          <Input label="Description" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="Provide details..." />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowServiceModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Raise Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
