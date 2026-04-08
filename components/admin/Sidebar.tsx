'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  Bell,
  UserCog,
  Clock,
  IndianRupee,
  BarChart3,
  Settings,
  Building2,
  LogOut,
  Wrench,
  ClipboardCheck,
  Search,
  UtensilsCrossed,
  Award,
  Megaphone,
  Activity,
  Upload,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
}

const navItems: Omit<NavItem, 'badge'>[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, href: '/admin/dashboard' },
  { label: 'Reservations', icon: <CalendarDays className="w-[18px] h-[18px]" />, href: '/admin/bookings' },
  { label: 'Front Desk', icon: <ClipboardCheck className="w-[18px] h-[18px]" />, href: '/admin/checkin' },
  { label: 'Amenities', icon: <Sparkles className="w-[18px] h-[18px]" />, href: '/admin/content/amenities' },
  { label: 'Food & Beverage Menu', icon: <UtensilsCrossed className="w-[18px] h-[18px]" />, href: '/admin/content/menu' },
  { label: 'Guests', icon: <Users className="w-[18px] h-[18px]" />, href: '/admin/guests' },
  { label: 'Rooms', icon: <BedDouble className="w-[18px] h-[18px]" />, href: '/admin/rooms' },
  { label: 'Payroll', icon: <IndianRupee className="w-[18px] h-[18px]" />, href: '/admin/payroll' },
  { label: 'Services', icon: <Bell className="w-[18px] h-[18px]" />, href: '/admin/services' },
  { label: 'Staff', icon: <UserCog className="w-[18px] h-[18px]" />, href: '/admin/staff' },
  { label: 'Leave Approvals', icon: <CalendarDays className="w-[18px] h-[18px]" />, href: '/admin/leaves' },
  { label: 'Attendance', icon: <Clock className="w-[18px] h-[18px]" />, href: '/admin/attendance' },
  { label: 'Lost & Found', icon: <Search className="w-[18px] h-[18px]" />, href: '/admin/lost-found' },
  { label: 'Restaurant Analysis', icon: <UtensilsCrossed className="w-[18px] h-[18px]" />, href: '/admin/restaurant-analysis' },
  { label: 'Loyalty Analysis', icon: <Award className="w-[18px] h-[18px]" />, href: '/admin/loyalty-analysis' },
  { label: 'Marketing', icon: <Megaphone className="w-[18px] h-[18px]" />, href: '/admin/marketing' },
  { label: 'Infrastructure', icon: <Activity className="w-[18px] h-[18px]" />, href: '/admin/infrastructure' },
  { label: 'Support', icon: <MessageSquare className="w-[18px] h-[18px]" />, href: '/admin/support' },
  { label: 'Bulk Import', icon: <Upload className="w-[18px] h-[18px]" />, href: '/admin/bulk-import' },
  { label: 'Reports', icon: <BarChart3 className="w-[18px] h-[18px]" />, href: '/admin/reports' },
  { label: 'Properties', icon: <Building2 className="w-[18px] h-[18px]" />, href: '/admin/properties' },
  { label: 'Subscription Model', icon: <Sparkles className="w-[18px] h-[18px]" />, href: '/admin/subscription-plans' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'STAFF'
  const userDept = (session?.user as any)?.department

  const [serviceCount, setServiceCount] = useState(0)

  const fetchServiceCount = async () => {
    try {
      const res = await fetch('/api/admin/services')
      if (res.ok) {
        const data = await res.json()
        setServiceCount(data.length)
      }
    } catch { }
  }

  useEffect(() => {
    fetchServiceCount()
    const interval = setInterval(fetchServiceCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const visibleItems = navItems
    .map(item => ({
      ...item,
      badge: item.href === '/admin/services' ? serviceCount : undefined,
    }))
    .filter(item => {
      // Properties & Subscription page: SUPER_ADMIN only
      if (['/admin/properties', '/admin/subscription-plans'].includes(item.href) && userRole !== 'SUPER_ADMIN') return false

      // Online Check-in: hotel-level roles only (NOT super_admin — no single property context, NOT staff)
      if (item.href === '/admin/checkin') {
        return ['HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(userRole)
      }

      // Finance Access for ACCOUNTS department - OVERRIDE for any role
      if (item.href === '/admin/payroll' && userDept === 'ACCOUNTS') return true

      // MANAGER / RECEPTIONIST: restricted access
      // MANAGER / RECEPTIONIST: simplified access
      if (userRole === 'MANAGER' || userRole === 'RECEPTIONIST') {
        const forbidden = ['/admin/properties', '/admin/subscription-plans', '/admin/settings', '/admin/leaves']
        if (forbidden.includes(item.href)) return false
      }

      // STAFF: restricted
      if (userRole === 'STAFF') {
        const allowed = [
          '/admin/dashboard', '/admin/bookings', '/admin/rooms', '/admin/services', 
          '/admin/attendance', '/admin/content/amenities', '/admin/content/menu'
        ]
        if (userDept === 'ACCOUNTS') allowed.push('/admin/payroll')
        return allowed.includes(item.href)
      }

      return true
    })

  return (
    <aside 
      data-tour="sidebar" 
      className={cn(
        "fixed left-0 top-0 h-full w-60 bg-[#0d1117] border-r border-white/[0.06] z-50 flex flex-col transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-6 h-6 bg-[#4A9EFF] rounded-md flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">Zenbourg</span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium ml-[34px]">Hotel Operations</p>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5 custom-scrollbar">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => {
                if (window.innerWidth < 768) onClose()
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                isActive
                  ? 'bg-[#4A9EFF] text-white'
                  : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
              )}
            >
              <span className={cn(
                'shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
              )}>
                {item.icon}
              </span>
              <span className="text-[13px] font-medium truncate">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 mt-auto border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#4A9EFF] flex items-center justify-center text-white text-[12px] font-bold shadow-lg shadow-[#4A9EFF]/20 shrink-0">
            {session?.user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white truncate leading-none mb-1">{session?.user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-gray-500 truncate">{session?.user?.email || 'admin@zenbourg.com'}</p>
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <Link
            href="/admin/settings"
            onClick={() => {
              if (window.innerWidth < 768) onClose()
            }}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
              pathname === '/admin/settings' ? 'bg-[#4A9EFF] text-white' : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <Settings className={cn("w-4 h-4 shrink-0", pathname === '/admin/settings' ? "text-white" : "text-gray-500 group-hover:text-gray-300")} />
            <span className="text-[12px] font-medium">Settings</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all group"
          >
            <LogOut className="w-4 h-4 text-gray-500 group-hover:text-gray-300 shrink-0" />
            <span className="text-[12px] font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
