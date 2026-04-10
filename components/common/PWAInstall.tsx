'use client'

import { useState, useEffect } from 'react'
import { X, Smartphone, Download, Zap, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)
        if (isStandaloneMatch) return

        const dismissedAt = localStorage.getItem('staff-pwa-dismissed-at')
        const isRecentlyDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt) < 1000 * 60 * 60 * 24 * 3) // 3 days for staff

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            if (!isRecentlyDismissed) {
                setTimeout(() => setIsVisible(true), 5000)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        window.addEventListener('appinstalled', () => {
            setIsStandalone(true)
            setIsVisible(false)
            setDeferredPrompt(null)
            toast.success("Terminal Deployed", {
                description: "Staff Operational Terminal is now native."
            })
        })

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        setIsVisible(false)
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem('staff-pwa-dismissed-at', Date.now().toString())
    }

    if (isStandalone || !isVisible || !deferredPrompt) return null

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 150, opacity: 0 }}
                className="fixed bottom-6 left-4 right-4 md:left-auto md:right-10 md:w-[400px] z-[300]"
            >
                <div className="relative overflow-hidden bg-[#0d1117] border border-blue-500/20 rounded-[32px] p-6 shadow-3xl backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <button onClick={handleDismiss} className="p-2 hover:bg-white/5 rounded-xl text-gray-600 hover:text-white transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Operational Terminal</h3>
                        <p className="text-[12px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Deploy the Zenbourg OS for dedicated performance and real-time operational alerts.
                        </p>
                    </div>

                    <button
                        onClick={handleInstall}
                        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl hover:bg-blue-500"
                    >
                        <Download className="w-4 h-4" />
                        Initialize Native Deployment
                    </button>
                    
                    <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic">
                        <CheckCircle2 size={12} className="text-emerald-500/40" />
                        Authorized System Handshake Ready
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
