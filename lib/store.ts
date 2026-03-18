import { create } from 'zustand'

type UserRole = 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'STAFF'

interface AppState {
    userRole: UserRole
    setUserRole: (role: UserRole) => void
}

export const useAppStore = create<AppState>((set) => ({
    userRole: 'SUPER_ADMIN', // Default for dev
    setUserRole: (role) => set({ userRole: role }),
}))
