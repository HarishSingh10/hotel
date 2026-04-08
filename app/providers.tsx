'use client'

import { SessionProvider } from 'next-auth/react'

import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(
                function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                },
                function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                }
            );
        }
    }, [])

    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}
