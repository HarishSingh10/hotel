'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ClipboardList, User, LogOut, Bell, MessageSquare, Calendar, CreditCard } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('SW Registered', reg))
                .catch((err) => console.log('SW Failed', err))
        }
    }, [])

    // Don't show layout on login page
    if (pathname === '/staff/login') return <>{children}</>

    const navItems = [
        { label: 'Home', icon: Home, href: '/staff' },
        { label: 'Tasks', icon: ClipboardList, href: '/staff/tasks' },
        { label: 'Schedule', icon: Calendar, href: '/staff/attendance' },
        { label: 'Profile', icon: User, href: '/staff/profile' },
    ]

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 pb-24">
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#2563eb" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            {/* Mobile Header */}
            <header className="bg-[#161b22] p-4 border-b border-white/[0.05] flex items-center justify-between sticky top-0 z-30 transition-all">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">ZB</div>
                    <h1 className="font-bold text-sm text-white tracking-tight italic">Zenbourg <span className="text-gray-500 font-medium not-italic ml-1">Staff</span></h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/staff/notifications')}
                        className="p-2 text-gray-400 hover:text-white relative transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#161b22]"></span>
                    </button>
                    <button
                        onClick={() => router.push('/staff/messages')}
                        className="p-2 text-gray-400 hover:text-white relative transition-colors"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#161b22]"></span>
                    </button>
                </div>
            </header>

            <main className="px-4 py-6 max-w-lg mx-auto">
                {children}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1117]/80 backdrop-blur-xl border-t border-white/[0.05] flex justify-around items-center p-3 z-40 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.5)]">
                {navItems.map((item) => {
                    const isActive = item.href === '/staff'
                        ? pathname === '/staff'
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300",
                                isActive ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "")} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            {isActive && <div className="absolute -bottom-3 w-8 h-1 bg-blue-500 rounded-full"></div>}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}


