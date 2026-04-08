'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import OnboardingTour from '@/components/common/OnboardingTour'

import { useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isAuthPage) {
    return children
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-60 ml-0 overflow-hidden w-full relative">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>

      {/* Mascot Onboarding Tour */}
      <OnboardingTour />
    </div>
  )
}

