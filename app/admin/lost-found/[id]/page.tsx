'use client'

import { useState } from 'react'
import {
    ChevronRight, ShieldAlert, CheckCircle2, AlertTriangle,
    Download, User, Clock, MapPin,
    Share2, Mail, Phone, Calendar,
    FileText, Image as ImageIcon, MessageSquare,
    ExternalLink, ArrowLeft, MoreVertical,
    Check, Fingerprint, Camera, Trash2,
    ShieldCheck, Bell, Briefcase, Tag,
    QrCode, Search, ChevronLeft, Send, Plus,
    Box
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

const ITEMS = {
    'LF-8821': {
        id: 'LF-8821',
        name: 'iPhone 14 Pro - Black',
        category: 'ELECTRONICS',
        status: 'UNDER INVESTIGATION',
        foundDate: 'Oct 24, 2023',
        foundTime: '14:32:11 GMT',
        location: 'Pool Side Bar (Section 4)',
        reportedBy: 'Staff: Jagat',
        investigator: {
            name: 'Alex Reed',
            role: 'Senior Security Lead',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
        },
        description: 'Black iPhone 14 Pro found abandoned on a sunbed near the Pool Bar. Device is locked but shows multiple notifications from "Sarah". No visible physical damage. Screen protector is cracked.',
        metadata: {
            brand: 'Apple',
            model: '14 Pro',
            color: 'Space Black',
            serial: 'IMEI-9981-LFP',
            estimatedValue: '$999'
        }
    }
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
    const item = ITEMS[params.id as keyof typeof ITEMS] || {
        id: params.id,
        name: 'Unknown Asset',
        category: 'UNCATEGORIZED',
        status: 'ARCHIVED',
        foundDate: '-',
        foundTime: '-',
        location: '-',
        reportedBy: '-',
        investigator: {
            name: 'Unassigned',
            role: '-',
            image: ''
        },
        description: 'No detailed record found for this unique identifier.',
        metadata: {}
    }

    const [note, setNote] = useState('')

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans">
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-30 bg-[#161b22] border-b border-gray-800">
                <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/admin/lost-found"
                            className="w-9 h-9 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-800 text-gray-400 transition-colors group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                                <span>Vault</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>Inventory</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-blue-500">{item.id}</span>
                            </div>
                            <h1 className="text-lg font-bold text-white tracking-tight">Case Dossier: {item.id}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{item.status}</span>
                        </div>
                        <button
                            onClick={() => toast.success('Case marked as RESOLVED. Documentation archived.')}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                            <ShieldCheck className="w-4 h-4" /> Resolve Case
                        </button>
                        <button className="p-2 border border-gray-700 hover:bg-red-600/10 hover:border-red-600/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── LEFT: CASE DOSSIER (8Cols) ── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Primary Identity Card */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                            <div className="w-full md:w-80 h-80 relative overflow-hidden shrink-0 border-r border-gray-800">
                                <img
                                    src="https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?q=80&w=400"
                                    className="w-full h-full object-cover"
                                    alt="item"
                                />
                                <button className="absolute bottom-4 right-4 p-2.5 bg-black/70 border border-white/10 rounded-lg text-white hover:bg-blue-600 transition-colors">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 p-10 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2 py-0.5 bg-blue-600/10 border border-blue-600/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider rounded">Property Asset</span>
                                    <span className="text-gray-700">•</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">High Value</span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
                                    {item.name}
                                </h2>
                                <div className="p-6 bg-[#0d1117] border border-gray-800 rounded-xl">
                                    <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Official Record</h4>
                                    <p className="text-[14px] text-gray-400 font-medium leading-relaxed italic">
                                        "{item.description}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Structured Evidence & Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Metadata */}
                            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm">
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Fingerprint className="w-4 h-4" /> Documentation
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(item.metadata).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center pb-3 border-b border-gray-800/50 last:border-0 last:pb-0">
                                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{key}</span>
                                            <span className="text-[13px] font-semibold text-gray-300">{val as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Evidence Gallery */}
                            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-3">
                                        <ImageIcon className="w-4 h-4" /> Evidence Media
                                    </h3>
                                    <button className="text-[10px] font-bold text-gray-600 uppercase hover:text-white transition-colors">View All (4)</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="aspect-square bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden cursor-pointer group">
                                        <img src="https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?q=80&w=200" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" alt="ev1" />
                                    </div>
                                    <div className="aspect-square bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden cursor-pointer relative group">
                                        <img src="https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=200" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" alt="ev2" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => toast.info('Accessing device storage for media upload...')}
                                        className="aspect-square bg-[#0d1117] border border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-colors cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider">Add Media</span>
                                    </div>
                                    <div
                                        onClick={() => toast.info('Initializing QR Generator for asset tracking...')}
                                        className="aspect-square bg-[#0d1117] border border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-colors cursor-pointer"
                                    >
                                        <QrCode className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider">Tag Asset</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Investigation Feed */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                    <MessageSquare className="w-4 h-4 text-blue-500" /> Chronological Feed
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Live System</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-[#161b22] border border-gray-800 rounded-xl shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-500">
                                                <User className="w-[18px] h-[18px]" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-white">Alex Reed</p>
                                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Primary Lead</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Today • 14:50</span>
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium leading-relaxed pl-4 border-l-2 border-blue-600/30">
                                        "Verified discovery location at Pool Side Bar. Security footage timestamp 14:28 confirms staff discovery. Item now secured in Vault Drawer 4B."
                                    </p>
                                </div>

                                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8">
                                    <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 ml-1">Append Entry</h4>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Record new observation..."
                                        className="w-full h-24 bg-[#0d1117] border border-gray-800 rounded-lg p-4 text-[14px] text-gray-300 placeholder:text-gray-700 outline-none focus:border-blue-500/50 transition-all font-medium resize-none shadow-inner"
                                    />
                                    <div className="flex items-center justify-end mt-4">
                                        <button
                                            onClick={() => {
                                                if (!note) return toast.error('Entry cannot be empty.')
                                                toast.success('Dossier updated successfully.')
                                                setNote('')
                                            }}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm active:scale-95"
                                        >
                                            Update Case <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: COMMAND SIDEBAR (4Cols) ── */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Status Watch Card */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-8">Chain of Custody</h4>
                            <div className="space-y-8 relative pl-4">
                                <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gray-800" />

                                {[
                                    { time: '14:32 PM', label: 'Item Discovery', actor: 'Jagat (Staff)', icon: ShieldAlert },
                                    { time: '14:45 PM', label: 'Vault Logging', actor: 'Sarah (Admin)', icon: Box },
                                    { time: '15:10 PM', label: 'Case Assignment', actor: 'Alex (Lead)', icon: User },
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 relative z-10 group cursor-pointer">
                                        <div className="w-4 h-4 rounded-full bg-[#0d1117] border border-gray-700 flex items-center justify-center shrink-0 group-hover:border-blue-500/50 transition-all">
                                            <div className="w-1 h-1 rounded-full bg-gray-800 group-hover:bg-blue-500 transition-all" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 leading-none">{step.time}</p>
                                            <p className="text-[13px] font-bold text-white mb-1 leading-none">{step.label}</p>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider leading-none">{step.actor}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map & Context */}
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-sm group">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">Discovery Proof</h4>
                            <div className="mb-6 h-36 bg-[#0d1117] rounded-lg overflow-hidden relative border border-gray-800">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=400')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                                        <MapPin className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Specific Location</p>
                                <p className="text-[14px] font-semibold text-gray-300 italic">{item.location}</p>
                            </div>
                            <button
                                onClick={() => toast.info('Fetching encrypted security footage logs...')}
                                className="w-full mt-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all"
                            >
                                View Security Log
                            </button>
                        </div>

                        {/* Final Action Module */}
                        <div className="bg-blue-600/5 border border-blue-600/10 rounded-xl p-10 text-center">
                            <h4 className="text-xl font-bold text-white mb-3 tracking-tight leading-tight">Return Protocols Ready</h4>
                            <p className="text-xs text-gray-500 font-medium mb-8 leading-relaxed">
                                Complete verification steps before releasing property to claimant.
                            </p>
                            <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]">
                                Process Item Release
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
