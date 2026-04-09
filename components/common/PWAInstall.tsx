'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(true)
    const [isStandalone, setIsStandalone] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)

        // Detect if already in standalone mode
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Auto-trigger if the user is interacting? No, user must click first.
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Handle manual trigger events from other components
        const manualHandler = () => {
            setIsVisible(true)
            handleInstall()
        }
        window.addEventListener('pwa-install-manual', manualHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            window.removeEventListener('pwa-install-manual', manualHandler)
        }
    }, [])

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
                setIsVisible(false)
            }
        } else {
            // For iOS or browsers without prompt support
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
                toast.info("Install Zenbourg OS", {
                    description: "Tap 'Share' (↑) Then 'Add to Home Screen' (+)",
                    duration: 10000,
                });
            } else {
                alert('To install Zenbourg:\n1. Open browser menu (⋮ or share)\n2. Tap "Install App" or "Add to Home Screen"')
            }
        }
    }

    if (!hasMounted || isStandalone || !isVisible) return null

    return (
        <div className="bg-[#161b22] border border-white/[0.05] rounded-[35px] p-6 shadow-3xl relative overflow-hidden group mb-8 animate-fade-in-up">
            {/* Background Flair: Gradient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full translate-x-20 -translate-y-20 group-hover:bg-blue-600/20 transition-all duration-700"></div>
            
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-5 right-5 text-gray-700 hover:text-white transition-colors p-2 z-20"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[22px] flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/20 border border-white/10 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] italic">System Optimization</h3>
                    </div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter mb-2">Native Experience</h2>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
                        Install the app directly for real-time notifications and full-screen performance.
                    </p>
                </div>
            </div>

            <div className="mt-8 relative z-10">
                <button
                    onClick={handleInstall}
                    className="w-full h-16 bg-white text-blue-600 rounded-[20px] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/10 active:scale-[0.98] transition-all group/btn italic"
                >
                    <Download className="w-5 h-5 transition-transform group-hover/btn:-translate-y-1" />
                    <span>{deferredPrompt ? 'Direct Download' : 'Cloud Setup'}</span>
                </button>
            </div>

            <div className="absolute -bottom-6 -left-6 opacity-5 pointer-events-none">
                <Smartphone className="w-32 h-32 -rotate-12" />
            </div>
        </div>
    )
}
