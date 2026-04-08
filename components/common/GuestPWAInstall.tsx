'use client'

import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GuestPWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

    useEffect(() => {
        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase()
        if (/iphone|ipad|ipod/.test(userAgent)) setPlatform('ios')
        else if (/android/.test(userAgent)) setPlatform('android')

        // Detect if already installed/standalone
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)

        // Check if user dismissed recently
        const dismissedAt = localStorage.getItem('pwa-dismissed-at')
        const isRecentlyDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt) < 1000 * 60 * 60 * 24) // 24h

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            if (!isStandaloneMatch && !isRecentlyDismissed) {
                setTimeout(() => setIsVisible(true), 3000) // Delay for better UX
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        // For iOS, beforeinstallprompt doesn't fire, so we show it manually if not standalone
        if (platform === 'ios' && !isStandaloneMatch && !isRecentlyDismissed) {
             setTimeout(() => setIsVisible(true), 4000)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [platform])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsVisible(false)
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem('pwa-dismissed-at', Date.now().toString())
    }

    if (isStandalone || !isVisible) return null

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: 100, opacity: 0, x: '-50%' }}
                animate={{ y: 0, opacity: 1, x: '-50%' }}
                exit={{ y: 100, opacity: 0, x: '-50%' }}
                className="fixed bottom-6 left-1/2 z-[100] w-[92%] max-w-md"
            >
                <div className="relative overflow-hidden bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {/* Background Glow */}
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#4A9EFF]/10 rounded-full blur-3xl opacity-50" />
                    
                    <div className="flex items-start gap-4">
                        {/* App Icon */}
                        <div className="w-14 h-14 bg-gradient-to-br from-[#4A9EFF] to-[#2D5BFF] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#4A9EFF]/20 border border-white/10">
                            <PlusSquare className="w-7 h-7 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-6">
                            <h3 className="text-[16px] font-bold text-white leading-tight mb-1">
                                Install Zenbourg Hotel
                            </h3>
                            <p className="text-[12px] text-gray-400 font-medium leading-relaxed">
                                {platform === 'ios' 
                                    ? "Tap 'Share' then 'Add to Home Screen' for a premium app experience."
                                    : "Install our lightning-fast app for the best management experience."
                                }
                            </p>
                        </div>

                        <button 
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        {platform === 'ios' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-full">
                                <Share className="w-4 h-4 text-[#4A9EFF]" />
                                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Share → Add to Home Screen</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 px-6 py-2.5 bg-[#4A9EFF] hover:bg-[#3A8EEF] text-white rounded-xl transition-all shadow-lg shadow-[#4A9EFF]/20 flex items-center justify-center gap-2 group"
                                >
                                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[13px] font-black uppercase tracking-wider">Install Now</span>
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[12px] uppercase rounded-xl transition-all"
                                >
                                    Not Now
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
