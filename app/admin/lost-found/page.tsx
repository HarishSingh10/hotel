'use client'

import { useState, useMemo } from 'react'
import {
    Search, Plus, ChevronDown, Package, Clock, MapPin,
    CheckCircle2, AlertCircle, Trash2, Filter,
    ArrowUpDown, MoreHorizontal, User, ShieldCheck,
    CreditCard, Calendar, BarChart3, Edit3, Camera,
    FileText, Command, ArrowRight, ShieldAlert,
    History, QrCode, FilterX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

const ITEMS = [
    {
        id: 'LF-8821',
        name: 'iPhone 14 Pro - Black',
        category: 'ELECTRONICS',
        status: 'FOUND',
        foundDate: 'Oct 24, 2023',
        location: 'Pool Side Bar',
        image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?q=80&w=400&auto=format&fit=crop',
        reportedBy: 'Staff: Jagat',
        description: 'Black iPhone 14 Pro found on a sunbed. No case.'
    },
    {
        id: 'LF-8819',
        name: 'Brown Leather Jacket',
        category: 'CLOTHING',
        status: 'CLAIMED',
        foundDate: 'Oct 23, 2023',
        location: 'Room 402 Closet',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop',
        reportedBy: 'Staff: Sarah',
        description: 'Genuine leather jacket, Zara brand, size M.'
    },
    {
        id: 'LF-8815',
        name: 'Gucci Shoulder Bag',
        category: 'PERSONAL',
        status: 'FOUND',
        foundDate: 'Oct 22, 2023',
        location: 'Lobby Lounge',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=400&auto=format&fit=crop',
        reportedBy: 'Staff: Mike',
        description: 'Small beige shoulder bag with gold hardware.'
    }
]

export default function LostFoundPage() {
    const [view, setView] = useState<'FOUND' | 'CLAIMED' | 'DISPOSED'>('FOUND')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false)
    const [isClaimProcessing, setIsClaimProcessing] = useState(false)

    // Dynamic Items State
    const [items, setItems] = useState([
        {
            id: 'LF-8821',
            name: 'iPhone 14 Pro - Black',
            category: 'ELECTRONICS',
            status: 'FOUND',
            foundDate: 'Oct 24, 2023',
            location: 'Pool Side Bar',
            image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?q=80&w=400&auto=format&fit=crop',
            reportedBy: 'Staff: Jagat',
            description: 'Black iPhone 14 Pro found on a sunbed. No case.'
        },
        {
            id: 'LF-8819',
            name: 'Brown Leather Jacket',
            category: 'CLOTHING',
            status: 'CLAIMED',
            foundDate: 'Oct 23, 2023',
            location: 'Room 402 Closet',
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop',
            reportedBy: 'Staff: Sarah',
            description: 'Genuine leather jacket, Zara brand, size M.'
        },
        {
            id: 'LF-8815',
            name: 'Gucci Shoulder Bag',
            category: 'PERSONAL',
            status: 'FOUND',
            foundDate: 'Oct 22, 2023',
            location: 'Lobby Lounge',
            image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=400&auto=format&fit=crop',
            reportedBy: 'Staff: Mike',
            description: 'Small beige shoulder bag with gold hardware.'
        }
    ])

    // Form State for New Item
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'ELECTRONICS',
        location: '',
        description: ''
    })

    const handleLogAsset = () => {
        if (!newItem.name || !newItem.location) {
            return toast.error('Please fill in essential asset details.')
        }

        const id = `LF-${Math.floor(1000 + Math.random() * 9000)}`
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

        const asset = {
            ...newItem,
            id,
            status: 'FOUND' as const,
            foundDate: date,
            reportedBy: 'Staff: Admin',
            image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcba80?q=80&w=400&auto=format&fit=crop' // Default formal placeholder
        }

        setItems([asset, ...items])
        setIsNewLogModalOpen(false)
        setNewItem({ name: '', category: 'ELECTRONICS', location: '', description: '' })
        toast.success(`Asset ${id} logged and secured.`)
    }

    const handleProcessReturn = (id: string) => {
        setIsClaimProcessing(true)
        setTimeout(() => {
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, status: 'CLAIMED' as const } : item
            ))
            setIsClaimProcessing(false)
            toast.success('Property successfully returned to guest.')
        }, 1200)
    }

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
        toast.info(`Asset ${id} removed from inventory.`)
    }

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesTab = item.status === view
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
            return matchesSearch && matchesTab && matchesCategory
        })
    }, [items, searchTerm, view, selectedCategory])

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans">
            {/* ── HEADER ── */}
            <div className="bg-[#161b22] border-b border-gray-800 px-8 py-5">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-900/20">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight leading-none mb-1">Lost & Found</h1>
                            <p className="text-xs text-gray-500 font-medium">Zenbourg Property Asset Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0d1117] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all focus:ring-1 focus:ring-blue-500/50 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsNewLogModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> New Log
                        </button>
                    </div>
                </div>
            </div>

            {/* ── NEW LOG MODAL ── */}
            {isNewLogModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setIsNewLogModalOpen(false)}
                    />
                    <div className="relative bg-[#161b22] border border-gray-800 w-full max-w-lg rounded-xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white">Log Discovery</h3>
                            <button onClick={() => setIsNewLogModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Asset Name</label>
                                <input
                                    placeholder="e.g. Wallet, Glasses, Smartphone"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                                    <div className="relative">
                                        <select
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                        >
                                            <option value="ELECTRONICS">Electronics</option>
                                            <option value="CLOTHING">Clothing</option>
                                            <option value="PERSONAL">Personal</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Found Location</label>
                                    <input
                                        placeholder="Room # or Area"
                                        value={newItem.location}
                                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                        className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Physical Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Provide distinguishing features..."
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 transition-all font-medium resize-none shadow-inner"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsNewLogModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-800 text-gray-400 hover:bg-gray-800 text-sm font-semibold rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogAsset}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                                >
                                    Log Asset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── MAIN CONTENT (9Cols) ── */}
                    <div className="lg:col-span-9 space-y-6">

                        {/* Filters Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161b22] px-6 py-4 rounded-xl border border-gray-800 shadow-sm">
                            <div className="flex bg-[#0d1117] p-1 rounded-lg border border-gray-800">
                                {['FOUND', 'CLAIMED', 'DISPOSED'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setView(tab as any)}
                                        className={cn(
                                            "px-5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                                            view === tab
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-gray-500 hover:text-gray-300"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="pl-9 pr-8 py-2 bg-[#0d1117] border border-gray-800 rounded-lg text-sm text-gray-400 outline-none focus:border-blue-500/50 appearance-none cursor-pointer hover:bg-[#161b22] transition-colors"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="ELECTRONICS">Electronics</option>
                                        <option value="CLOTHING">Clothing</option>
                                        <option value="PERSONAL">Personal</option>
                                    </select>
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Assets</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-white leading-none">{items.length}</span>
                                    <span className="text-[11px] text-green-500 font-medium pb-1">Live Inventory</span>
                                </div>
                            </div>
                            <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Resolution Rate</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-white leading-none">
                                        {items.length > 0 ? Math.round((items.filter(i => i.status === 'CLAIMED').length / items.length) * 100) : 0}%
                                    </span>
                                    <div className="w-16 h-1 bg-gray-800 rounded-full mb-2">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${items.length > 0 ? (items.filter(i => i.status === 'CLAIMED').length / items.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Discovery Frequency</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-white leading-none">
                                        {items.filter(i => i.status === 'FOUND').length}
                                    </span>
                                    <span className="text-[11px] text-gray-600 pb-1">Found Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table/List */}
                        <div className="space-y-4">
                            {filteredItems.length === 0 ? (
                                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                                        <FilterX className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-1">No items found</h3>
                                    <p className="text-sm text-gray-500 max-w-xs">Try adjusting your search filters or check a different category.</p>
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-[#233648] border border-gray-800 rounded-xl overflow-hidden shadow-sm hover:border-gray-700 transition-all flex flex-col md:flex-row"
                                    >
                                        <div className="w-full md:w-56 h-56 md:h-auto shrink-0 relative">
                                            <img
                                                src={item.image}
                                                className="w-full h-full object-cover"
                                                alt={item.name}
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className={cn(
                                                    "px-2.5 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm border",
                                                    item.status === 'FOUND'
                                                        ? "bg-amber-600/20 border-amber-600/30 text-amber-500"
                                                        : "bg-blue-600/20 border-blue-600/30 text-blue-500"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-8 flex flex-col">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">{item.category}</span>
                                                        <span className="text-gray-700">•</span>
                                                        <span className="text-[11px] font-mono text-gray-500">#{item.id}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                                                    <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                <div className="flex flex-row md:flex-col gap-2">
                                                    <Link
                                                        href={`/admin/lost-found/${item.id}`}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg text-center transition-colors"
                                                    >
                                                        Details
                                                    </Link>
                                                    {item.status === 'FOUND' && (
                                                        <button
                                                            onClick={() => handleProcessReturn(item.id)}
                                                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                                                        >
                                                            Claim
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="px-4 py-2 border border-gray-800 hover:border-red-600/50 hover:text-red-500 text-gray-500 text-xs font-semibold rounded-lg transition-all"
                                                    >
                                                        Trash
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-auto grid grid-cols-2 gap-6 pt-6 border-t border-gray-800/50">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-gray-600" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Found Date</p>
                                                        <p className="text-sm font-medium text-gray-300">{item.foundDate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-gray-600" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Location</p>
                                                        <p className="text-sm font-medium text-gray-300">{item.location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: FORM (3Cols) ── */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 bg-[#161b22] border border-gray-800 rounded-xl p-8 overflow-hidden">
                            <h3 className="text-lg font-bold text-white mb-1">Process Claim</h3>
                            <p className="text-xs text-gray-500 mb-8 font-medium">Verified Property Return</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Guest / Claimant</label>
                                    <input
                                        type="text"
                                        placeholder="Full name or room #"
                                        className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-700 outline-none focus:border-blue-500/50 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Identification</label>
                                    <div className="relative">
                                        <select className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
                                            <option>Passport / ID Card</option>
                                            <option>Room Key Card</option>
                                            <option>Reservation ID</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Acknowledgment</label>
                                    <div className="h-32 bg-[#0d1117] border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center p-4">
                                        <div className="text-center">
                                            <Edit3 className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                                            <p className="text-[11px] text-gray-700 font-medium uppercase tracking-wider">Digital Signature Area</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsClaimProcessing(true)
                                        setTimeout(() => {
                                            setIsClaimProcessing(false)
                                            toast.success('Property successfully returned to guest.')
                                        }, 1500)
                                    }}
                                    disabled={isClaimProcessing}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isClaimProcessing ? 'Verifying...' : 'Complete Return'}
                                </button>

                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
                                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-[11px] text-amber-500/80 font-medium leading-relaxed uppercase tracking-wider">
                                        Ensure ID verification matches guest profile before return.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
