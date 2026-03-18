'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function StaffLoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            })

            if (result?.error) {
                console.error('Login error:', result.error)
                toast.error(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error)
            } else {
                toast.success('Welcome back!')
                // Refresh to propagate the NextAuth session, then navigate
                router.refresh()
                setTimeout(() => {
                    router.push('/staff')
                }, 300)
            }
        } catch (error) {
            toast.error('Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Zenbourg</h1>
                    <p className="text-gray-500 mt-2">Staff Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email or Phone Number"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="staff@zenbourg.com"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-14 text-lg"
                        loading={loading}
                        type="submit"
                    >
                        Login
                    </Button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-8">
                    Contact manager if you forgot credentials.
                </p>
            </div>
        </div>
    )
}

