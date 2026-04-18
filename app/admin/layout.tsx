'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import OnboardingTour from '@/components/common/OnboardingTour'

const Sidebar = dynamic(() => import('@/components/admin/Sidebar'), { ssr: false })
const Header  = dynamic(() => import('@/components/admin/Header'),  { ssr: false })

const AUTH_PATHS = ['/admin/login', '/admin/register', '/admin/forgot-password']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Auth pages: render children directly, no layout chrome
  // Use mounted check so server and client render the SAME structure initially
  const isAuthPage = AUTH_PATHS.includes(pathname)

  if (!mounted) {
    // Server render + pre-hydration: always render the full layout shell
    // so server HTML matches client HTML exactly
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="flex-1 flex flex-col md:ml-60 ml-0 overflow-hidden w-full relative">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // After hydration: auth pages get no chrome
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-60 ml-0 overflow-hidden w-full relative">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>

      <OnboardingTour />
    </div>
  )
}
