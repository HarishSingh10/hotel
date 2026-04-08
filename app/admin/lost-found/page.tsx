'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    Search, Plus, ChevronDown, Package, Clock, MapPin,
    CheckCircle2, AlertCircle, Trash2, Filter,
    ArrowUpDown, MoreHorizontal, User, ShieldCheck,
    CreditCard, Calendar, BarChart3, Edit3, Camera,
    FileText, Command, ArrowRight, ShieldAlert,
    History, QrCode, FilterX, Send, History as HistoryIcon, Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { getAdminContext } from '@/lib/admin-context'

export default function LostFoundPage() {
    const [mounted, setMounted] = useState(false)
    const { propertyId } = getAdminContext()

    useEffect(() => {
        setMounted(true)
    }, [])

    const [view, setView] = useState<'FOUND' | 'CLAIMED' | 'DISPOSED'>('FOUND')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false)
    const [isClaimProcessing, setIsClaimProcessing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Dynamic Items State
    const [items, setItems] = useState<any[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [recentGuests, setRecentGuests] = useState<any[]>([])

    // Form State for New Item
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'ELECTRONICS',
        location: '',
        description: '',
        roomId: '',
        image: ''
    })

    useEffect(() => {
        if (propertyId && propertyId !== 'ALL') {
            fetchItems()
            fetchRooms()
        }
    }, [propertyId])

    const fetchItems = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/lost-found?propertyId=${propertyId}`)
            if (res.ok) {
                const data = await res.json()
                setItems(data)
            }
        } catch (error) {
            console.error('Failed to fetch items:', error)
            toast.error('Could not load inventory.')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchRooms = async () => {
        try {
            const res = await fetch(`/api/admin/rooms?propertyId=${propertyId}`)
            if (res.ok) {
                const data = await res.json()
                setRooms(data)
            }
        } catch (e) { console.error(e) }
    }

    const fetchHistoryForRoom = async (roomId: string) => {
        if (!roomId) return setRecentGuests([])
        try {
            const res = await fetch(`/api/admin/rooms/${roomId}/history`)
            if (res.ok) {
                const data = await res.json()
                setRecentGuests(data)
            }
        } catch (e) { console.error(e) }
    }

    const handleLogAsset = async () => {
        if (!newItem.name || (!newItem.location && !newItem.roomId)) {
            return toast.error('Please fill in essential asset details.')
        }

        try {
            const res = await fetch('/api/admin/lost-found', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newItem, propertyId })
            })

            if (res.ok) {
                const data = await res.json()
                setItems([data, ...items])
                setIsNewLogModalOpen(false)
                setNewItem({ name: '', category: 'ELECTRONICS', location: '', description: '', roomId: '', image: '' })
                toast.success(`Asset identified and logged.`)
            }
        } catch (error) {
            toast.error('Failed to log discovery.')
        }
    }

    const handleProcessReturn = async (id: string, claimerData?: any) => {
        setIsClaimProcessing(true)
        try {
            const res = await fetch(`/api/admin/lost-found/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLAIMED', ...claimerData })
            })

            if (res.ok) {
                const data = await res.json()
                setItems(prev => prev.map(item => item.id === id ? data : item))
                toast.success('Property successfully returned to guest.')
            }
        } catch (error) {
            toast.error('Failed to process claim.')
        } finally {
            setIsClaimProcessing(false)
        }
    }

    const handleNotifyGuest = (item: any) => {
        const phone = item.guest?.phone || item.claimerPhone
        if (!phone) return toast.error('No contact number available.')

        // Format phone: remove non-digits
        let cleanPhone = phone.replace(/\D/g, '')
        // If 10 digits, add India prefix
        if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`
        
        const message = `Hello ${item.guest?.name || 'Guest'}, this is ${item.property?.name || 'Hotel Management'}. We found a ${item.name} in ${item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.location}. Is this yours? Case ID: ${item.id}`
        
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
        toast.success('Opening WhatsApp...')
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return
        try {
            const res = await fetch(`/api/admin/lost-found/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setItems(prev => prev.filter(item => item.id !== id))
                toast.info(`Asset discarded.`)
            }
        } catch (e) { toast.error('Failed to delete item.') }
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

    if (!mounted) return null

    if (propertyId === 'ALL') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <ShieldAlert className="w-16 h-16 text-amber-500 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white mb-2">Select a Property Context</h2>
                <p className="text-gray-500 max-w-sm">Lost & Found inventory is managed per-property. Please select a specific hotel from the switcher above to continue.</p>
            </div>
        )
    }

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
                            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Vault Inventory Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search Case ID or Asset name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0d1117] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all focus:ring-1 focus:ring-blue-500/50 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsNewLogModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Log Discovery
                        </button>
                    </div>
                </div>
            </div>

            {/* ── NEW LOG MODAL ── */}
            {isNewLogModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsNewLogModalOpen(false)} />
                    <div className="relative bg-[#161b22] border border-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 grid grid-cols-1 md:grid-cols-2">
                        
                        {/* Form Side */}
                        <div className="p-10 border-r border-gray-800">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white">Capture Asset</h3>
                                <button onClick={() => setIsNewLogModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-[11px] font-bold text-blue-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Room Found (Initial Intelligence)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={newItem.roomId}
                                            onChange={(e) => {
                                                const rid = e.target.value
                                                setNewItem({ ...newItem, roomId: rid })
                                                fetchHistoryForRoom(rid)
                                            }}
                                            className="w-full bg-[#0d1117] border-2 border-blue-500/20 group-hover:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.05)]"
                                        >
                                            <option value="">Public Area / Lobby</option>
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                                    </div>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-1">Selecting a room automatically links recent guest records.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Asset Name</label>
                                    <input
                                        placeholder="e.g. iPhone 14 Pro, Leather Wallet"
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
                                                <option value="ID_DOCUMENTS">Documents</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Custom Location</label>
                                        <input
                                            placeholder="e.g. Near Pool"
                                            value={newItem.location}
                                            onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                            className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Detailed Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Distinguishing marks, color, brand..."
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 transition-all font-medium resize-none shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Asset Photo</label>
                                    <div className="flex items-center gap-4 p-4 bg-[#0d1117] border border-gray-800 rounded-xl">
                                        <div className="w-16 h-16 bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                                            {newItem.image ? (
                                                <img src={newItem.image} className="w-full h-full object-cover" alt="preview" />
                                            ) : (
                                                <Camera className="w-6 h-6 text-gray-800" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                id="asset-image"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const reader = new FileReader()
                                                        reader.onloadend = () => {
                                                            setNewItem({ ...newItem, image: reader.result as string })
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                            />
                                            <label 
                                                htmlFor="asset-image"
                                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600/10 border border-blue-600/20 text-blue-500 text-[10px] font-bold uppercase tracking-widest rounded-lg cursor-pointer hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Select Image
                                            </label>
                                            <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-widest ml-1">Directly attaching evidence</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setIsNewLogModalOpen(false)}
                                        className="flex-1 py-3 border border-gray-800 text-gray-400 hover:bg-gray-800 text-sm font-semibold rounded-lg transition-all"
                                    >
                                        Discard
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

                        {/* Intelligence Side */}
                        <div className="bg-[#0d1117] p-10 flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <HistoryIcon className="w-5 h-5 text-blue-500" />
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Historical Intelligence</h4>
                            </div>

                            {!newItem.roomId ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                    <Search className="w-12 h-12 mb-4 text-gray-600" />
                                    <p className="text-xs font-medium max-w-[200px]">Select a room number to fetch recent guest history.</p>
                                </div>
                            ) : recentGuests.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-800 rounded-xl">
                                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No Recent Guest Logs</p>
                                </div>
                            ) : (
                                <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Previous Occupants</p>
                                    {recentGuests.map((booking: any) => (
                                        <div key={booking.id} className="p-4 bg-[#161b22] border border-gray-800 rounded-xl hover:border-blue-500/30 transition-colors group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{booking.guest.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">#{booking.id.slice(-6)}</p>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-0.5 text-[9px] font-bold rounded uppercase",
                                                    booking.status === 'CHECKED_OUT' ? "bg-gray-800 text-gray-500" : "bg-green-600/10 text-green-500"
                                                )}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 mb-3">
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <Calendar className="w-3 h-3 text-gray-600" />
                                                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <Phone className="w-3 h-3 text-gray-600" />
                                                    {booking.guest.phone}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Auto-linking enabled</p>
                                        </div>
                                    ))}
                                    <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-xl">
                                        <p className="text-[10px] text-blue-400 font-medium leading-relaxed italic">
                                            "Asset will be automatically associated with the most recent guest for communication."
                                        </p>
                                    </div>
                                </div>
                            )}
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
                                        className="pl-9 pr-10 py-2 bg-[#0d1117] border border-gray-800 rounded-lg text-sm text-gray-300 outline-none focus:border-blue-500/50 appearance-none cursor-pointer hover:bg-[#161b22] transition-colors"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="ELECTRONICS">Electronics</option>
                                        <option value="CLOTHING">Clothing</option>
                                        <option value="PERSONAL">Personal</option>
                                        <option value="ID_DOCUMENTS">Documents</option>
                                    </select>
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                </div>
                                <button 
                                    onClick={fetchItems}
                                    className="p-2.5 bg-[#0d1117] border border-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Package className="w-16 h-16" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Live Inventory</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-bold text-white leading-none">{items.length}</span>
                                    <span className="text-[11px] text-blue-500 font-bold uppercase tracking-wider pb-1">Total Assets</span>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Resolution Efficiency</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl font-bold text-white leading-none">
                                        {items.length > 0 ? Math.round((items.filter(i => i.status === 'CLAIMED').length / items.length) * 100) : 0}%
                                    </span>
                                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                                            style={{ width: `${items.length > 0 ? (items.filter(i => i.status === 'CLAIMED').length / items.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Disclosures</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-bold text-white leading-none">
                                        {items.filter(i => i.status === 'FOUND').length}
                                    </span>
                                    <span className="text-[11px] text-amber-500 font-bold uppercase tracking-wider pb-1">Unclaimed</span>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table/List */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center opacity-50">
                                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Querying Vault...</p>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="bg-[#161b22]/50 border border-gray-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-[#0d1117] rounded-full flex items-center justify-center mb-6 shadow-2xl border border-gray-800">
                                        <FilterX className="w-10 h-10 text-gray-700" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Zero Matches Found</h3>
                                    <p className="text-sm text-gray-500 max-w-xs leading-relaxed">No assets match your current filtering criteria. Try expanding your search scope.</p>
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:border-gray-700 hover:shadow-2xl hover:shadow-blue-900/10 transition-all flex flex-col md:flex-row group"
                                    >
                                        <div className="w-full md:w-64 h-64 md:h-auto shrink-0 relative bg-[#0d1117]">
                                            <img
                                                src={item.image || 'https://images.unsplash.com/photo-1581235720704-06d3acfcba80?q=80&w=400'}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                alt={item.name}
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className={cn(
                                                    "px-3 py-1 text-[10px] font-bold uppercase rounded-lg shadow-xl border backdrop-blur-md",
                                                    item.status === 'FOUND'
                                                        ? "bg-amber-600/20 border-amber-600/30 text-amber-500"
                                                        : "bg-blue-600/20 border-blue-600/30 text-blue-500"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-8 flex flex-col">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">{item.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-800" />
                                                        <span className="text-[10px] font-mono text-gray-600 tracking-wider transition-colors group-hover:text-gray-400">#{item.id.slice(-8).toUpperCase()}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors">{item.name}</h3>
                                                    <p className="text-[13px] text-gray-500 leading-relaxed max-w-xl font-medium line-clamp-2">
                                                        {item.description || 'No detailed physical description provided for this asset.'}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                                                    <Link
                                                        href={`/admin/lost-found/${item.id}`}
                                                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all active:scale-95"
                                                    >
                                                        View Case
                                                    </Link>
                                                    {item.status === 'FOUND' && (
                                                        <button
                                                            onClick={() => handleProcessReturn(item.id)}
                                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                                        >
                                                            Claim
                                                        </button>
                                                    )}
                                                    {item.guest && item.status === 'FOUND' && (
                                                        <button
                                                            onClick={() => handleNotifyGuest(item)}
                                                            className="flex items-center justify-center gap-2 px-6 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all border active:scale-95 bg-emerald-600/10 border-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white"
                                                        >
                                                            <Send className="w-3.5 h-3.5" /> WhatsApp
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-2 border border-gray-800 hover:border-red-600/50 hover:text-red-500 text-gray-700 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-auto grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-800/50">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-gray-700" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-tight">Logged</p>
                                                        <p className="text-[11px] font-bold text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-gray-700" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-tight">Location</p>
                                                        <p className="text-[11px] font-bold text-gray-400 truncate max-w-[120px]">
                                                            {item.room ? `Room ${item.room.roomNumber}` : item.location}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <User className="w-4 h-4 text-gray-700" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-tight">Linkage</p>
                                                        <p className="text-[11px] font-bold text-blue-500">
                                                            {item.guest ? item.guest.name : 'Unknown Guest'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-4 h-4 text-gray-700" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-tight">Officer</p>
                                                        <p className="text-[11px] font-bold text-gray-400">{item.reportedBy?.user?.name || 'Admin'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: FAST ACTIONS (3Cols) ── */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-gradient-to-b from-[#161b22] to-[#0d1117] border border-gray-800 rounded-2xl p-8 overflow-hidden relative shadow-2xl">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
                                <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Rapid Resolution</h3>
                                <p className="text-[11px] text-gray-500 mb-8 font-bold uppercase tracking-widest">Property Return Protocol</p>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Case Ref / Claimant</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Case ID..."
                                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder:text-gray-700 outline-none focus:border-blue-500/50 transition-all shadow-inner font-medium"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Acknowledgment</label>
                                        <div className="h-32 bg-[#0d1117] border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center p-6 group cursor-pointer hover:border-blue-500/30 transition-all">
                                            <Edit3 className="w-8 h-8 text-gray-800 mb-3 group-hover:text-blue-500 transition-colors" />
                                            <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest group-hover:text-gray-500 transition-colors text-center">Biometric / digital signature required</p>
                                        </div>
                                    </div>

                                    <button
                                        disabled={isClaimProcessing}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isClaimProcessing ? 'Verifying...' : 'Finalize Release'}
                                    </button>

                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-4">
                                        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[10px] text-amber-500/70 font-bold leading-relaxed uppercase tracking-widest">
                                            Verification must match property audit trails before asset release.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                                <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">Vault Status</h4>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-gray-400">Security Guard</span>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-bold text-white tracking-widest">ACTIVE</span>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-800 w-full mb-4" />
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-gray-600">
                                        <span>Capacity</span>
                                        <span className="text-white">82%</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full">
                                        <div className="h-full bg-blue-600 w-[82%] rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
