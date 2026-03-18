'use client'

import { useState, useEffect } from 'react'
import { 
    Sparkles, 
    Crown, 
    Gem, 
    CheckCircle2, 
    Plus, 
    Save, 
    Building2, 
    Users, 
    Megaphone, 
    BarChart3, 
    ShieldCheck, 
    Loader2 
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PlanDef {
    id?: string
    plan: 'GOLD' | 'PLATINUM' | 'DIAMOND'
    features: string[]
    price: number
    description?: string
}

const AVAILABLE_FEATURES = [
    { id: 'BASIC_OPS', label: 'Basic Operations', icon: Building2, desc: 'Core reservation and front-desk modules' },
    { id: 'STAFF_MANAGEMENT', label: 'Staff Management', icon: Users, desc: 'Payroll, leaves, and attendance' },
    { id: 'MARKETING', label: 'Marketing Engine', icon: Megaphone, desc: 'Campaigns and loyalty programs' },
    { id: 'ANALYTICS', label: 'Advanced Analytics', icon: BarChart3, desc: 'Deep insights and custom reports' },
    { id: 'AI_INSIGHTS', label: 'Stelle AI Insights', icon: Sparkles, desc: 'AI-driven growth and optimization' },
    { id: 'PRIORITY_SUPPORT', label: 'Priority Support', icon: ShieldCheck, desc: '24/7 dedicated assistance' },
]

export default function SubscriptionPlansPage() {
    const [plans, setPlans] = useState<PlanDef[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'GOLD' | 'PLATINUM' | 'DIAMOND'>('GOLD')

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/subscription-plans')
            if (res.ok) {
                const data = await res.json()
                setPlans(data)
            }
        } catch (error) {
            toast.error('Failed to load plan definitions')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleFeature = (planType: string, featureId: string) => {
        setPlans(prev => prev.map(p => {
            if (p.plan !== planType) return p
            const newFeatures = p.features.includes(featureId)
                ? p.features.filter(f => f !== featureId)
                : [...p.features, featureId]
            return { ...p, features: newFeatures }
        }))
    }

    const handleSave = async (plan: PlanDef) => {
        setSaving(plan.plan)
        try {
            const res = await fetch('/api/admin/subscription-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(plan)
            })
            if (res.ok) {
                toast.success(`${plan.plan} configuration saved successfully`)
                fetchPlans()
            } else {
                toast.error(`Failed to save ${plan.plan} plan`)
            }
        } catch (error) {
            toast.error('Connection error')
        } finally {
            setSaving(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentPlan = plans.find(p => p.plan === activeTab)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Subscription Model Config</h1>
                <p className="text-text-secondary">Define default features and pricing for each subscription tier</p>
            </div>

            <div className="flex gap-4 p-1 bg-surface-light border border-white/5 rounded-2xl w-fit">
                {['GOLD', 'PLATINUM', 'DIAMOND'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setActiveTab(p as any)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                            activeTab === p 
                                ? "bg-primary text-white shadow-xl shadow-primary/20" 
                                : "text-text-secondary hover:text-white"
                        )}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan Summary Card */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-[#1a2333] border-border overflow-hidden">
                        <div className="p-6 text-center border-b border-border bg-white/5">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                {activeTab === 'GOLD' && <Sparkles className="w-8 h-8 text-amber-500" />}
                                {activeTab === 'PLATINUM' && <Crown className="w-8 h-8 text-blue-400" />}
                                {activeTab === 'DIAMOND' && <Gem className="w-8 h-8 text-indigo-400" />}
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{activeTab} Tier</h2>
                            <div className="flex items-center justify-center gap-1 text-2xl font-black text-primary">
                                <span className="text-lg opacity-60">$</span>
                                {currentPlan?.price || 0}
                                <span className="text-[10px] text-text-tertiary uppercase tracking-tighter">/month</span>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Monthly Pricing</label>
                                <input 
                                    type="number" 
                                    value={currentPlan?.price || 0}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value)
                                        setPlans(prev => prev.map(p => p.plan === activeTab ? { ...p, price: val } : p))
                                    }}
                                    className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <Button 
                                className="w-full gap-2" 
                                loading={saving === activeTab}
                                onClick={() => currentPlan && handleSave(currentPlan)}
                            >
                                <Save className="w-4 h-4" /> Save Configuration
                            </Button>
                        </div>
                    </Card>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                        <h4 className="text-[12px] font-bold text-primary flex items-center gap-2 mb-3 tracking-wide uppercase">
                            <CheckCircle2 size={14} /> Information
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            Changes made here will define the <strong>base features</strong> for new properties signing up for this tier. Existing properties will not be automatically updated to ensure no accidental downtime.
                        </p>
                    </div>
                </div>

                {/* Features Selection Grid */}
                <div className="lg:col-span-2">
                    <Card className="bg-surface border-border">
                        <div className="p-5 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-white">Feature Allocation</h3>
                            <Badge variant="primary" className="h-5 text-[9px] px-2">{currentPlan?.features.length || 0} Active Features</Badge>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AVAILABLE_FEATURES.map((feat) => {
                                const isIncluded = currentPlan?.features.includes(feat.id)
                                return (
                                    <div 
                                        key={feat.id}
                                        onClick={() => handleToggleFeature(activeTab, feat.id)}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4",
                                            isIncluded 
                                                ? "bg-[#233648] border-primary/40 ring-1 ring-primary/20 shadow-lg shadow-black/30" 
                                                : "bg-surface-light border-border/50 opacity-60 hover:opacity-100 grayscale hover:grayscale-0"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                            isIncluded ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-gray-400"
                                        )}>
                                            <feat.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h5 className="text-[13px] font-bold text-white truncate">{feat.label}</h5>
                                                {isIncluded && <div className="p-1 bg-primary rounded-full"><Plus className="w-2 h-2 text-white rotate-45" /></div>}
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium leading-tight line-clamp-2">{feat.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
