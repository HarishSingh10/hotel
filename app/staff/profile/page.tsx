'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    User, Mail, Phone, LogOut,
    FileText, Calendar, CreditCard,
    Settings, Umbrella, Info, Clock,
    ChevronRight, ShieldCheck, Briefcase, Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import PWAInstall from '@/components/common/PWAInstall'

export default function StaffProfilePage() {
    const { data: session } = useSession()
    const router = useRouter()

    const quickActions = [
        { label: 'Apply for Leave', icon: Umbrella, href: '/staff/leave', color: 'bg-emerald-500/10 text-emerald-500', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=200' },
        { label: 'Salary Slips', icon: CreditCard, href: '/staff/payroll', color: 'bg-blue-600/10 text-blue-500' },
        { label: 'My Roster', icon: Calendar, href: '/staff/attendance', color: 'bg-indigo-600/10 text-indigo-500' },
        { label: 'Contact Info', icon: Info, href: '#', color: 'bg-purple-600/10 text-purple-500' },
    ]

    const details = [
        { label: 'Employee ID', value: 'ZB-4092', icon: Briefcase },
        { label: 'Department', value: 'Front Office', icon: ShieldCheck },
        { label: 'Join Date', value: 'Mar 12, 2021', icon: Calendar },
        { label: 'Email', value: session?.user?.email || 'sarah.j@zenbourg.com', icon: Mail },
    ]

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Profile Header */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-[40px] p-8 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute top-4 right-6 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">On Duty</span>
                </div>

                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 p-1 group-hover:rotate-6 transition-transform duration-500">
                        <div className="w-full h-full rounded-[38px] bg-[#0d1117] flex items-center justify-center overflow-hidden border-4 border-[#161b22]">
                            <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
                                alt=""
                                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                            />
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight italic">{session?.user?.name || 'Sarah Jenkins'}</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Front Desk Associate</p>

                <div className="flex items-center gap-3 mt-8">
                    <button
                        onClick={() => router.push('/staff/attendance')}
                        className="h-11 px-6 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <Calendar className="w-3.5 h-3.5" /> View Schedule
                    </button>
                    <button className="h-11 w-11 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Employee Details Card */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.03]">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">Employee Details</h3>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {details.map((item, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between group cursor-default hover:bg-white/[0.01] transition-colors">
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                                <p className="text-sm font-bold text-gray-200">{item.value}</p>
                            </div>
                            <item.icon className="w-4 h-4 text-gray-700 group-hover:text-blue-500/40 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic ml-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => action.href !== '#' && router.push(action.href)}
                            className="bg-[#161b22] border border-white/[0.05] rounded-[32px] p-2 flex flex-col h-40 relative group overflow-hidden transition-all hover:border-white/10 active:scale-95"
                        >
                            <div className="flex-1 w-full rounded-[24px] overflow-hidden bg-[#0d1117] relative">
                                {action.img ? (
                                    <img src={action.img} alt="" className="w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <action.icon className={cn("w-8 h-8 opacity-10", action.color.split(' ')[1])} />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", action.color.split(' ')[0])}>
                                        <action.icon className={cn("w-5 h-5", action.color.split(' ')[1])} />
                                    </div>
                                </div>
                            </div>
                            <div className="py-2 px-2 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white ml-2">{action.label}</span>
                                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:translate-x-1 group-hover:text-white transition-all mr-2" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Balances Card */}
            <div className="bg-[#161b22] border border-white/[0.05] rounded-3xl p-6 flex divide-x divide-white/[0.03]">
                <div className="flex-1 pr-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Umbrella className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Leave Balance</p>
                        <p className="text-sm font-black text-white">12 Days</p>
                    </div>
                </div>
                <div className="flex-1 pl-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Next Shift</p>
                        <p className="text-sm font-black text-white italic">Tomorrow, 9AM</p>
                    </div>
                </div>
            </div>

            <PWAInstall />

            <button
                onClick={() => signOut({ callbackUrl: '/staff/login' })}
                className="w-full h-16 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-500/10 transition-all active:scale-[0.98] mt-4 shadow-xl shadow-black/20"
            >
                <LogOut className="w-4 h-4" />
                Sign Out Account
            </button>
        </div>
    )
}

