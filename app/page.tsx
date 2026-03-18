'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building2, 
  ShieldCheck, 
  UserCog, 
  ChevronRight, 
  Download, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Globe, 
  Lock,
  Menu,
  X,
  Smartphone
} from 'lucide-react'
import { usePwaInstall } from '@/lib/hooks/usePwaInstall'
import { cn } from '@/lib/utils'

export default function ProfessionalLandingPage() {
  const { isInstallable, installPwa } = usePwaInstall()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Solutions', href: '#solutions' },
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
  ]

  return (
    <div className="min-h-screen bg-[#0B1117] text-white selection:bg-primary/30 selection:text-white font-sans scroll-smooth">
      {/* 1. FIXED NAVBAR */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b",
        scrolled 
          ? "bg-[#0B1117]/80 backdrop-blur-xl border-white/10 py-4 shadow-2xl" 
          : "bg-transparent border-transparent py-7"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-all shadow-[0_0_20px_rgba(74,158,255,0.2)]">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              Zenbourg
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="h-4 w-px bg-white/10 mx-2" />
            <Link 
              href="/admin/login"
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-bold hover:bg-white/10 transition-all"
            >
              Enterprise Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0B1117] border-b border-white/10 p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top duration-300">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-lg font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/admin/login"
              className="w-full py-4 bg-primary text-center rounded-2xl font-bold"
            >
              Enterprise Login
            </Link>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-48 pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/2 opacity-30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2 opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[13px] font-bold text-gray-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            V2.0 is now live: Revolutionizing Hospitality Cloud
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.05] max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Orchestrate <span className="text-primary italic">Hospitality</span> Excellence.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            The next-generation operations platform for boutique hotels and luxury estates. 
            Automate workflows, delight guests, and master your property.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in zoom-in duration-1000 delay-500">
            <Link 
              href="/admin/login"
              className="w-full sm:w-auto px-10 py-5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Management Portal <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/staff/login"
              className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Staff Dashboard <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. PWA DOWNLOAD SECTION */}
      <section className="py-24 relative overflow-hidden bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#151D25] border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Smartphone className="w-64 h-64 text-primary" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Zenbourg <br/> on your device.</h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Access the full power of Zenbourg on the go. Optimized for mobile, 
                  our PWA offers instant access to your hospitality commands, 
                  notifications, and tasks.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  {isInstallable && (
                    <button 
                      onClick={installPwa}
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 hover:shadow-lg hover:shadow-primary/20 transition-all"
                    >
                      <Download className="w-5 h-5" /> Install Zenbourg Mobile
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure PWA Environment
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 relative">
                 {/* Card for Admin App */}
                 <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] space-y-4 hover:border-primary/50 transition-all group shadow-inner">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Admin Panel</h3>
                    <p className="text-sm text-gray-500 font-medium">Full property management & financial insights.</p>
                 </div>
                 {/* Card for Staff App */}
                 <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] space-y-4 hover:border-emerald-500/50 transition-all group shadow-inner translate-y-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <UserCog className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Staff Portal</h3>
                    <p className="text-sm text-gray-500 font-medium">Real-time tasks, status updates & requests.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Everything needed to run <br/> a world-class property.</h2>
            <p className="text-lg text-gray-500 font-medium">A unified ecosystem that replaces fragmented tools with one cohesive experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Calendar/>, title: "Booking Engine", desc: "Enterprise-grade reservation management with real-time sync across channels." },
              { icon: <Users/>, title: "Guest Intelligence", desc: "Deep profiles and VIP status tracking to personalize every interaction automatically." },
              { icon: <BarChart3/>, title: "Revenue Analysis", desc: "Detailed reports on ADR, RevPAR, and operational efficiency with one-click exports." },
              { icon: <Building2/>, title: "Inventory Master", desc: "Real-time room status tracking from 'Clean' to 'Maintenance Required'." },
              { icon: <Globe/>, title: "Scalable Infrastructure", desc: "Built on high-availability cloud architecture to ensure 99.9% uptime for your business." },
              { icon: <Lock/>, title: "Enterprise Security", desc: "Military-grade encryption and role-based access to keep your guest data protected." },
            ].map((f, i) => (
              <div key={i} className="p-10 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-6 hover:bg-white/[0.04] hover:border-white/20 transition-all shadow-inner">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                  {React.cloneElement(f.icon as React.ReactElement, { className: 'w-7 h-7' })}
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{f.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tighter">Zenbourg</span>
            </Link>
            <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto md:mx-0">
              The premium command center for luxury hospitality management.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Product</h4>
            <div className="flex flex-col gap-4 text-sm text-gray-500 font-medium">
              <Link href="#" className="hover:text-white transition-colors">Portals</Link>
              <Link href="#" className="hover:text-white transition-colors">Features</Link>
              <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Company</h4>
            <div className="flex flex-col gap-4 text-sm text-gray-500 font-medium">
              <Link href="#" className="hover:text-white transition-colors">About</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Support</h4>
            <div className="flex flex-col gap-4 text-sm text-gray-500 font-medium">
              <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
              <Link href="#" className="hover:text-white transition-colors">Status</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[13px] text-gray-600 font-bold">&copy; 2026 Zenbourg Hospitality Systems. All rights reserved.</p>
          <div className="flex items-center gap-8 text-[13px] text-gray-600 font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
