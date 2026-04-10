'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(true)
    const [isStandalone, setIsStandalone] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop')

    useEffect(() => {
        setHasMounted(true)

        // Detect Platform
        const ua = window.navigator.userAgent.toLowerCase()
        if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
        else if (/android/.test(ua)) setPlatform('android')

        // Detect if already in standalone mode
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            console.log('✨ PWA: Native Install Protocol Captured')
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Monitor app install status
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null)
            setIsStandalone(true)
            toast.success('System Terminal Installed', {
                description: 'Zenbourg is now accessible from your home screen.'
            })
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
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
            if (platform === 'ios') {
                toast.info("Native Deployment instructions", {
                    description: "1. Tap 'Share' (↑) at the bottom.\n2. Select 'Add to Home Screen' (+)",
                    duration: 8000,
                })
            } else {
                toast.info("Direct Install Protocol", {
                    description: "Browser prompt not triggered yet. Tap settings (⋮) > Install App manually.",
                    duration: 8000,
                })
            }
        }
    }

    if (!hasMounted || isStandalone || !isVisible) return null

    return (
        <div className="bg-[#161b22] border border-blue-500/20 rounded-[45px] p-8 shadow-3xl relative overflow-hidden group mb-10 animate-fade-in-up border-l-[6px] border-l-blue-600">
            {/* Advanced Background Flair */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full translate-x-20 -translate-y-20 group-hover:bg-blue-600/20 transition-all duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full -translate-x-10 translate-y-10"></div>
            
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-6 right-6 text-gray-700 hover:text-white transition-all p-2 z-20 hover:rotate-90"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-8 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-blue-500/30 border border-white/10 group-hover:scale-105 transition-all duration-500">
                    <Smartphone className="w-10 h-10 text-white" />
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">Native Access Protocol</h3>
                    </div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2 leading-tight uppercase underline underline-offset-8 decoration-blue-500/20">Operational Efficiency</h2>
                    <p className="text-[11px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest italic opacity-80 mb-6">
                        Eliminate browser overhead. Install Zenbourg OS for dedicated full-screen performance and real-time dispatch alerts.
                    </p>

                    <button
                        onClick={handleInstall}
                        className={cn(
                            "w-full h-16 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-[0.97] group/btn italic shadow-2xl",
                            deferredPrompt 
                                ? "bg-white text-blue-600 shadow-blue-500/20 hover:bg-blue-50" 
                                : "bg-blue-600 text-white shadow-blue-500/20 border border-blue-400/20 hover:bg-blue-700"
                        )}
                    >
                        {deferredPrompt ? (
                            <>
                                <Download className="w-5 h-5 transition-transform group-hover/btn:-translate-y-1" />
                                <span>Direct Deployment Download</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 fill-white" />
                                <span>{platform === 'ios' ? 'Mobile Link Terminal' : 'Cloud Setup Protocol'}</span>
                            </>
                        )}
                    </button>
                    
                    {!deferredPrompt && (
                        <p className="mt-4 text-[9px] text-gray-700 font-black uppercase tracking-widest text-center italic opacity-60">
                            {platform === 'ios' ? 'Safari Manual Bypass Required' : 'Waiting for system handshake...'}
                        </p>
                    )}
                </div>
            </div>

            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-1000">
                <Smartphone className="w-48 h-48 -rotate-12 transition-transform duration-1000 group-hover:rotate-0" />
            </div>
        </div>
    )
}
