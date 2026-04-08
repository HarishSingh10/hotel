import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/admin/login',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('[AUTH] Missing email or password')
                    return null
                }

                const identifier = credentials.email.trim()
                console.log(`[AUTH] --- NEW LOGIN ATTEMPT ---`)
                console.log(`[AUTH] Identifier: "${identifier}"`)

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: { equals: identifier, mode: 'insensitive' } },
                            { phone: identifier }
                        ]
                    },
                })

                if (!user) {
                    console.log(`[AUTH] USER NOT FOUND in DB for: "${identifier}"`)
                    return null
                }

                console.log(`[AUTH] Found user: ${user.email} (Role: ${user.role}, Status: ${user.status})`)
                console.log(`[AUTH] Hash in DB: ${user.password.substring(0, 10)}...`)

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    console.log(`[AUTH] PASSWORD MISMATCH for user: ${user.email}`)
                    console.log(`[AUTH] Provided password: "${credentials.password}"`)
                    return null
                }

                console.log(`[AUTH] LOGIN SUCCESS for: ${user.email}`)

                // For multi-tenant: hotel-specific data scoping
                let propertyId = (user as any).workplaceId

                // If owner has no direct workplace, use their first owned property
                if (!propertyId && (user as any).ownedPropertyIds?.[0]) {
                    propertyId = (user as any).ownedPropertyIds[0]
                }

                // Fetch department if staff
                let department = null
                if (user.role === 'STAFF' || user.role === 'MANAGER' || user.role === 'RECEPTIONIST') {
                    const staff = await prisma.staff.findUnique({ where: { userId: user.id } })
                    department = staff?.department
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    propertyId,
                    department
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.propertyId = token.propertyId as string
                session.user.department = token.department as string
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.propertyId = (user as any).propertyId
                token.department = (user as any).department
            }
            return token
        },
    },
}
