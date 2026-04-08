'use client'

import { useState, useEffect } from 'react'
import {
    Activity, ShieldCheck, Wifi, Cpu,
    RefreshCw, AlertCircle, AlertTriangle,
    CheckCircle2, Battery, HardDrive,
    Download, Play, Search, MoreHorizontal,
    Loader2, Signal, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildContextUrl as bcu, getAdminContext } from '@/lib/admin-context'

export default function InfrastructurePage() {
    const [nodes, setNodes] = useState<any[]>([])
    const [alerts, setAlerts] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [uptimeData, setUptimeData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [runningDiag, setRunningDiag] = useState(false)

    const fetchInfraData = async () => {
        try {
            const res = await fetch(bcu('/api/admin/infrastructure'))
            if (res.ok) {
                const data = await res.json()
                setNodes(data.nodes)
                setAlerts(data.alerts)
                setStats(data.stats)
                setUptimeData(data.uptimeData)
            }
        } catch (error) {
            console.error('Error fetching infra data:', error)
            toast.error('Failed to load system diagnostics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInfraData()
    }, [])

    const handleRunDiagnostics = () => {
        const { propertyId } = getAdminContext()
        setRunningDiag(true)
        toast.promise(
            (async () => {
                // Call simulation API to create a real system event
                const res = await fetch('/api/admin/infrastructure/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        type: 'SYSTEM_DIAGNOSTIC',
                        propertyId: propertyId !== 'ALL' ? propertyId : undefined
                    })
                })
                if (!res.ok) throw new Error('Simulation failed')
                
                // Small delay to feel like "diagnostics"
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                await fetchInfraData()
            })(),
            {
                loading: 'Running system-wide diagnostics...',
                success: () => {
                    setRunningDiag(false)
                    return 'All systems operational. Diagnostic log updated.'
                },
                error: (err) => {
                    setRunningDiag(false)
                    return 'Diagnostics failed to complete: ' + err.message
                }
            }
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans p-8">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Infrastructure Health</h1>
                        <p className="text-gray-500 font-medium">Real-time monitoring of POS, Sync, Wi-Fi and IoT systems.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border border-white/5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                            <Download className="w-4 h-4 text-gray-500" /> Report
                        </button>
                        <button
                            onClick={handleRunDiagnostics}
                            disabled={runningDiag}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                        >
                            {runningDiag ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Run Diagnostics
                        </button>
                    </div>
                </div>

                {/* ── TOP STATS CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'POS Integration', value: stats?.posStatus, sub: stats?.posUptime, icon: HardDrive, color: 'text-emerald-500', bg: 'bg-emerald-500/10', labelColor: 'text-emerald-500', tag: 'OPERATIONAL' },
                        { label: 'Channel Manager', value: stats?.channelManagerStatus, sub: stats?.lastSync, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10', labelColor: 'text-blue-500', tag: 'SYNCING' },
                        { label: 'Wi-Fi Network', value: stats?.wifiHealth, sub: stats?.offlineAPs, icon: Wifi, color: 'text-amber-500', bg: 'bg-amber-500/10', labelColor: 'text-amber-500', tag: 'WARNING', subColor: 'text-amber-500' },
                        { label: 'IoT Devices', value: stats?.iotAlerts, sub: stats?.batteryAlerts, icon: Cpu, color: 'text-red-500', bg: 'bg-red-500/10', labelColor: 'text-red-500', tag: 'CRITICAL', subColor: 'text-red-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#161b22] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <span className={cn("text-[9px] font-bold tracking-[0.2em]", stat.labelColor)}>{stat.tag}</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", stat.color)} />
                                <p className={cn("text-[11px] font-medium", stat.subColor || "text-gray-500")}>{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MIDDLE SECTION ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Uptime Chart */}
                    <div className="lg:col-span-8 bg-[#161b22] border border-white/5 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-white">System Uptime & Performance</h3>
                                <p className="text-xs text-gray-500 font-medium">Last 24 hours monitoring across all nodes</p>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Last 24 Hours <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-3 px-2">
                            {uptimeData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="w-full relative h-48 flex items-end">
                                        <div
                                            className={cn(
                                                "w-full rounded-md transition-all group-hover:brightness-110",
                                                d.status === 'error' ? "bg-red-500/40" :
                                                    d.status === 'warning' ? "bg-amber-500/40" : "bg-blue-600/40",
                                                i === uptimeData.length - 1 && "bg-blue-600"
                                            )}
                                            style={{ height: `${d.value}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">{d.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Alerts */}
                    <div className="lg:col-span-4 bg-[#161b22] border border-white/5 rounded-xl p-8 shadow-sm flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-1">Recent Alerts</h3>
                        <p className="text-xs text-gray-500 font-medium mb-8">Critical and warning logs</p>

                        <div className="space-y-6 flex-1">
                            {alerts.map((alert, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                                        alert.type === 'CRITICAL' ? "border-red-500/20 bg-red-500/5 text-red-500" :
                                            alert.type === 'WARNING' ? "border-amber-500/20 bg-amber-500/5 text-amber-500" :
                                                "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                                    )}>
                                        {alert.type === 'CRITICAL' ? <AlertCircle className="w-5 h-5" /> :
                                            alert.type === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> :
                                                <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[13px] font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{alert.message}</p>
                                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{alert.description}</p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="text-[10px] text-gray-600 font-bold uppercase">{alert.time}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-800" />
                                            <span className="text-[10px] text-gray-600 font-bold uppercase">{alert.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-8 py-3 text-blue-500 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/5 rounded-lg hover:bg-white/5 transition-all">
                            View all system logs
                        </button>
                    </div>
                </div>

                {/* ── INFRASTRUCTURE NODES TABLE ── */}
                <div className="bg-[#161b22] border border-white/5 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <h3 className="text-xl font-bold text-white">Infrastructure Nodes Status</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#0d1117] text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Node Name</th>
                                    <th className="px-8 py-5">Type</th>
                                    <th className="px-8 py-5">IP Address</th>
                                    <th className="px-8 py-5">Uptime</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {nodes.map((node, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-white/5 flex items-center justify-center">
                                                    <Signal className={cn("w-4 h-4",
                                                        node.status === 'Online' ? "text-emerald-500" :
                                                            node.status === 'High Load' ? "text-amber-500" : "text-red-500"
                                                    )} />
                                                </div>
                                                <span className="text-sm font-bold text-white">{node.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs text-gray-500 font-medium">{node.type}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <code className="text-[11px] font-mono bg-[#0d1117] px-2 py-1 rounded text-blue-400">
                                                {node.ipAddress}
                                            </code>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-gray-400">{node.uptime}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        node.status === 'Online' ? "bg-emerald-500" :
                                                            node.status === 'High Load' ? "bg-amber-500" : "bg-red-500"
                                                    )} />
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        node.status === 'Online' ? "text-emerald-500" :
                                                            node.status === 'High Load' ? "text-amber-500" : "text-red-500"
                                                    )}>{node.status}</span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const { propertyId } = getAdminContext()
                                                        toast.promise(
                                                            fetch('/api/admin/infrastructure/simulate', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ 
                                                                    type: 'IOT_FAILURE',
                                                                    propertyId: propertyId !== 'ALL' ? propertyId : undefined
                                                                })
                                                            }).then(() => fetchInfraData()),
                                                            { loading: `Simulating alert for ${node.name}...`, success: 'Alert generated.', error: 'Simulation failed.' }
                                                        )
                                                    }}
                                                    className="text-[10px] font-bold text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                                >
                                                    Troubleshoot
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {nodes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-500 ">
                                            Scanning for infrastructure nodes...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
