'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(true)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)

        // Detect Standalone
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(ios)

        // Listen for prompt
        const handler = (e: any) => {
            console.log('PWA: beforeinstallprompt event captured')
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)

        const manualHandler = () => {
            setIsVisible(true)
            handleInstall()
        }
        window.addEventListener('pwa-install-manual', manualHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            window.removeEventListener('pwa-install-manual', manualHandler)
        }
    }, [deferredPrompt])

    const handleInstall = async () => {
        if (!deferredPrompt) {
            toast.info('To install: Tap your browser menu and select "Install App" or "Add to Home Screen"', {
                description: 'This allows you to access the staff portal quickly from your phone.',
                duration: 6000
            })
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsVisible(false)
        }
    }

    // Don't render anything until hydrated or if already installed/dismissed
    if (!hasMounted || isStandalone || !isVisible) return null

    return (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group mb-6 border border-white/10 animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>

            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-md">
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-black text-white leading-none mb-1.5 italic tracking-tight flex items-center gap-2">
                        Install Staff Portal
                    </h3>
                    <p className="text-xs text-blue-100/60 font-bold leading-relaxed">
                        Add to home screen for real-time task alerts and a seamless mobile experience.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {isIOS ? (
                            <p className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <Share className="w-3.5 h-3.5 text-blue-300" /> Tap Share &gt; Add to Home Screen
                            </p>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="h-11 px-6 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                            >
                                <Download className="w-4 h-4" /> {deferredPrompt ? 'Download Now' : 'Show Manual Steps'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-1 right-8 opacity-5">
                <Smartphone className="w-24 h-24 rotate-12" />
            </div>
        </div>
    )
}
