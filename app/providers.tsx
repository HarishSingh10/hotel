'use client'

import { SessionProvider } from 'next-auth/react'
import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

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
            <SWRConfig 
                value={{
                    fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
                    revalidateOnFocus: false,
                    revalidateIfStale: true,
                    dedupingInterval: 5000
                }}
            >
                {children}
                <Toaster richColors position="top-right" theme="dark" />
            </SWRConfig>
        </SessionProvider>
    )
}

