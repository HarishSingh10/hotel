'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function GuestPWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Detect if already installed/standalone
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://')

        setIsStandalone(isStandaloneMatch)

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            if (!isStandaloneMatch) {
                setIsVisible(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        // For testing/manual trigger
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
        if (!deferredPrompt) {
            toast.info('To install: Tap your browser menu and select "Install App" or "Add to Home Screen"', {
                description: 'Experience Zenbourg in full screen on your device.',
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

    if (isStandalone || !isVisible) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-between bg-[#131823]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2.5 shadow-2xl">
                
                <div className="flex items-center gap-3">
                    {/* App Icon */}
                    <div className="w-12 h-12 bg-black/50 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden">
                        {/* Placeholder for Logo, you can replace with your actual logo */}
                         <div className="w-6 h-6 border-[3px] border-[#F4A261] rounded-sm transform rotate-45"></div>
                    </div>
                    
                    {/* Text block */}
                    <div className="flex flex-col">
                        <h3 className="text-[15px] font-bold text-white leading-tight tracking-tight">
                            Zenbourg App
                        </h3>
                        <p className="text-[12px] text-gray-400 font-medium">
                            Free • Smart Hotel
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mr-1">
                    {/* Get Button */}
                    <button
                        onClick={handleInstall}
                        className="px-5 py-2 bg-[#232B3E] hover:bg-[#2A344A] border border-[#F4A261]/20 rounded-full transition-colors group"
                    >
                        <span className="text-[13px] font-black tracking-wide text-[#F4A261] group-active:scale-95 inline-block transition-transform">
                            GET
                        </span>
                    </button>
                    
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    )
}
