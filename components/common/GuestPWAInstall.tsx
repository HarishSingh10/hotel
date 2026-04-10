'use client'

import { useState, useEffect } from 'react'
import { X, Smartphone, Download, Zap, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function GuestPWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // 1. Detect if already installed/standalone
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)

        if (isStandaloneMatch) return

        // 2. Check dismissal history
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed-at')
        const isRecentlyDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt) < 1000 * 60 * 60 * 24 * 7) // 7 days

        // 3. Capture Install Prompt
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            
            // Show prompt only if not dismissed recently
            if (!isRecentlyDismissed) {
                setTimeout(() => setIsVisible(true), 6000) // Tactical delay
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        // 4. Track successful install
        window.addEventListener('appinstalled', () => {
            setIsStandalone(true)
            setIsVisible(false)
            setDeferredPrompt(null)
            toast.success("System Optimized", {
                description: "Native Terminal successfully deployed to your home screen."
            })
        })

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        
        setIsVisible(false)
        deferredPrompt.prompt()
        
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            localStorage.removeItem('pwa-prompt-dismissed-at')
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem('pwa-prompt-dismissed-at', Date.now().toString())
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
                <div className="relative overflow-hidden bg-[#0d1117] border border-blue-500/20 rounded-[32px] p-6 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    {/* Visual Flair */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full translate-x-10 -translate-y-10" />
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 border border-white/10 shrink-0">
                            <Zap className="w-8 h-8 text-white fill-white" />
                        </div>
                        <button 
                            onClick={handleDismiss}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-600 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Zenbourg Native Access
                        </h3>
                        <p className="text-[12px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Upgrade to the tactical terminal. Eliminate browser latency and unlock full-screen performance.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleInstall}
                            className="flex-1 h-14 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl hover:bg-gray-100"
                        >
                            <Download className="w-4 h-4" />
                            Install Now
                        </button>
                        <div className="hidden sm:flex items-center gap-2 px-5 py-4 bg-white/5 rounded-2xl border border-white/5 shrink-0">
                            <Smartphone className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System v2</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic">
                        <CheckCircle2 size={12} className="text-emerald-500/40" />
                        Verified Direct Deployment Secure
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
