'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Search, LogOut, User, Settings, Building2, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Avatar from '@/components/common/Avatar'
import PropertySwitcher from '@/components/admin/PropertySwitcher'
import { isGlobalContext } from '@/lib/admin-context'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [expandedNotifications, setExpandedNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { data: session } = useSession()

  const user = {
    name: session?.user?.name || 'User',
    email: session?.user?.email || 'user@example.com',
    role: session?.user?.role || 'STAFF',
    photo: null,
  }

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/services')
      if (res.ok) {
        const data = await res.json()
        const formatted = data.map((d: any) => ({
          id: d.id,
          message: `Room ${d.room}: ${d.type.replace('_', ' ')} requested`,
          time: new Date(d.requestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: d.status === 'PENDING'
        }))
        setNotifications(formatted)
        setUnreadCount(formatted.filter((n: any) => n.unread).length)
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#0d1117] border-b border-white/[0.08]">
      {/* Search & Menu */}
      <div className="flex items-center gap-4 flex-1 mr-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search guests, bookings, rooms..."
              className="w-full pl-10 pr-4 py-2 bg-surface-light/50 border border-border/50 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Property Switcher for Super Admin */}
      <div className="hidden lg:block">
        <PropertySwitcher />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Quick Actions */}
        <button
          data-tour="new-booking"
          className="btn-primary btn text-xs md:text-sm px-3 md:px-4 py-2"
          onClick={() => {
            if (session?.user?.role === 'SUPER_ADMIN' && isGlobalContext()) {
              toast.error('Please select a hotel first')
              return
            }
            router.push('/admin/bookings/new')
          }}
        >
          <span className="hidden xs:inline">+ New Booking</span>
          <span className="xs:hidden">+</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) setExpandedNotifications(false);
            }}
            className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-light rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => { setShowNotifications(false); setExpandedNotifications(false); }}
              />
              <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-xl z-50 animate-fade-in">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    You have {unreadCount} unread notifications
                  </p>
                </div>
                <div className={cn(
                  "overflow-y-auto transition-all duration-300",
                  expandedNotifications ? "max-h-[420px]" : "max-h-[240px]"
                )}>
                  {(expandedNotifications ? notifications : notifications.slice(0, 4)).map((notif) => (
                    <button
                      key={notif.id}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-surface-light transition-colors border-b border-border last:border-b-0',
                        notif.unread && 'bg-primary/5'
                      )}
                    >
                      <p className="text-sm text-text-primary">{notif.message}</p>
                      <p className="text-xs text-text-tertiary mt-1">{notif.time}</p>
                    </button>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-text-tertiary text-xs">
                      No new notifications
                    </div>
                  )}
                </div>
                {!expandedNotifications && notifications.length > 4 && (
                  <div className="p-2 border-t border-border">
                    <button 
                      onClick={() => setExpandedNotifications(true)}
                      className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1 pr-3 hover:bg-surface-light rounded-lg transition-colors"
          >
            <Avatar name={user.name} src={user.photo} size="sm" />
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">{user.role.replace('_', ' ')}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl z-50 animate-fade-in">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-text-primary">{user.name}</p>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowProfile(false); router.push('/admin/settings') }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-light rounded transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => { setShowProfile(false); router.push('/admin/settings') }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-light rounded transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
