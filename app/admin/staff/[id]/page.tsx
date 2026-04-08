'use client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    CreditCard,
    TrendingUp,
    Clock,
    ArrowLeft,
    CheckCircle2,
    Star,
    Edit2,
    Eye,
    EyeOff,
    MoreHorizontal,
    FileText,
    Download,
    CalendarDays,
    Plus,
    Save,
    Loader2,
    X,
    ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

type TabType = 'PERSONAL' | 'PAYROLL' | 'PERFORMANCE' | 'LEAVE'

export default function StaffDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [staff, setStaff] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('PERSONAL')
    const [showSalary, setShowSalary] = useState(false)
    const [isEditModalOpen, setEditModalOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    
    const [editForm, setEditForm] = useState({
        name: '', email: '', phone: '',
        designation: '', department: '',
        employeeId: '', baseSalary: '',
        dateOfJoining: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        address: '',
        contractType: '',
        workShift: '',
        managerName: '',
        status: 'ACTIVE'
    })

    const [leaveSubmitting, setLeaveSubmitting] = useState(false)
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'CASUAL',
        startDate: '',
        endDate: '',
        reason: ''
    })

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            const res = await fetch(`/api/admin/staff/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })
            if (res.ok) {
                toast.success('Personnel record updated')
                setEditModalOpen(false)
                // Refresh data
                const updated = await fetch(`/api/admin/staff/${params.id}`)
                if (updated.ok) setStaff(await updated.json())
            } else {
                toast.error('Failed to update record')
            }
        } catch (error) {
            toast.error('Error updating record')
        } finally {
            setIsUpdating(false)
        }
    }

    const leaveDays = leaveForm.startDate && leaveForm.endDate
        ? Math.max(1, Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 0

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
            toast.error('Please fill all leave fields')
            return
        }
        setLeaveSubmitting(true)
        try {
            const res = await fetch(`/api/admin/staff/${params.id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaveType: leaveForm.leaveType,
                    startDate: leaveForm.startDate,
                    endDate: leaveForm.endDate,
                    totalDays: leaveDays,
                    reason: leaveForm.reason
                })
            })
            if (res.ok) {
                toast.success('Leave request submitted successfully')
                setLeaveForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' })
                // Refresh staff data
                const updated = await fetch(`/api/admin/staff/${params.id}`)
                if (updated.ok) setStaff(await updated.json())
            } else {
                toast.error('Failed to submit leave request')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLeaveSubmitting(false)
        }
    }

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await fetch(`/api/admin/staff/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setStaff(data)
                    // Prefill edit form
                    setEditForm({
                        name: data.user.name || '',
                        email: data.user.email || '',
                        phone: data.user.phone || '',
                        designation: data.designation || '',
                        department: data.department || '',
                        employeeId: data.employeeId || '',
                        baseSalary: String(data.baseSalary || ''),
                        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining).toISOString().split('T')[0] : '',
                        emergencyContactName: data.emergencyContactName || '',
                        emergencyContactPhone: data.emergencyContactPhone || '',
                        address: data.address || '',
                        contractType: data.contractType || 'Full-Time Permanent',
                        workShift: data.workShift || 'Morning (06:00 - 14:00)',
                        managerName: data.managerName || 'Michael Scott',
                        status: data.user.status || 'ACTIVE'
                    })
                } else {
                    toast.error('Failed to load staff details')
                    router.push('/admin/staff')
                }
            } catch (error) {
                console.error(error)
                toast.error('Something went wrong')
            } finally {
                setLoading(false)
            }
        }
        fetchStaff()
    }, [params.id, router])

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        
        // Header
        doc.setFillColor(35, 54, 72)
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.text("PERSONNEL RECORD", 15, 25)
        
        doc.setFontSize(10)
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 140, 25)
        
        // Profile Info
        doc.setTextColor(33, 33, 33)
        doc.setFontSize(14)
        doc.text("Primary Employee Data", 15, 55)
        
        const profileData = [
            ["Full Name", staff.user.name],
            ["Employee ID", staff.employeeId],
            ["Designation", staff.designation],
            ["Department", staff.department.replace('_', ' ')],
            ["Joining Date", new Date(staff.dateOfJoining).toLocaleDateString()],
            ["Work Shift", staff.workShift || 'Morning (06:00 - 14:00)'],
            ["Contract", staff.contractType || 'Full-Time Permanent']
        ]
        
        autoTable(doc, {
            startY: 62,
            head: [['Field', 'Information']],
            body: profileData,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] }
        })
        
        // Contact Info
        doc.setFontSize(14)
        doc.text("Contact Information", 15, (doc as any).lastAutoTable.finalY + 15)
        
        const contactData = [
            ["Email", staff.user.email],
            ["Phone", staff.user.phone || 'N/A'],
            ["Emergency Contact", staff.emergencyContactName || 'N/A'],
            ["Emergency Phone", staff.emergencyContactPhone || 'N/A'],
            ["Home Address", staff.address || 'N/A']
        ]
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Contact Type', 'Details']],
            body: contactData,
            theme: 'grid',
            headStyles: { fillColor: [52, 73, 94] }
        })
        
        // Payment History (Top 5)
        if (staff.payrolls && staff.payrolls.length > 0) {
            doc.setFontSize(14)
            doc.text("Recent Payment Profile (Last 5 Cycles)", 15, (doc as any).lastAutoTable.finalY + 15)
            
            const paymentData = staff.payrolls.slice(0, 5).map((p: any) => [
                `${p.month} ${p.year}`,
                `Rs. ${p.baseSalary}`,
                `Rs. ${p.incentives + (p.bonuses || 0)}`,
                `Rs. ${p.netSalary}`,
                p.status
            ])
            
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Period', 'Base', 'Added', 'Net Salary', 'Status']],
                body: paymentData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }
            })
        }

        // Attendance History (Last 30)
        if (staff.attendances && staff.attendances.length > 0) {
            doc.addPage()
            doc.setFillColor(35, 54, 72)
            doc.rect(0, 0, 210, 20, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(14)
            doc.text("Attendance & Continuity Record", 15, 13)
            
            doc.setTextColor(33, 33, 33)
            const attendanceData = staff.attendances.slice(0, 30).map((a: any) => [
                new Date(a.date).toLocaleDateString(),
                a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                `${a.hoursWorked || '0.0'} hrs`,
                a.status
            ])
            
            autoTable(doc, {
                startY: 25,
                head: [['Date', 'Punch In', 'Punch Out', 'Duration', 'Status']],
                body: attendanceData,
                theme: 'grid',
                headStyles: { fillColor: [52, 73, 94] }
            })
        }
        
        doc.save(`${staff.user.name.replace(/\s+/g, '_')}_comprehensive_record.pdf`)
        toast.success('Comprehensive Personnel PDF generated successfully')
    }

    if (loading) return <div className="p-8 space-y-8 animate-pulse">
        <div className="flex gap-8">
            <div className="w-80 h-[600px] bg-white/5 rounded-3xl" />
            <div className="flex-1 space-y-8">
                <div className="h-16 bg-white/5 rounded-2xl w-full" />
                <div className="h-[400px] bg-white/5 rounded-3xl w-full" />
            </div>
        </div>
    </div>

    if (!staff) return null

    const tabs = [
        { id: 'PERSONAL', label: 'Personal & Employment', icon: User },
        { id: 'PAYROLL', label: 'Payroll & Compensation', icon: CreditCard },
        { id: 'PERFORMANCE', label: 'Performance', icon: TrendingUp },
        { id: 'LEAVE', label: 'Leave & Attendance', icon: CalendarDays },
    ]

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Directory</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={exportToPDF}
                            variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />}
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            Export Personnel Record (PDF)
                        </Button>
                    </div>
                    <Button onClick={() => setEditModalOpen(true)} className="bg-white/5 border-white/10 hover:bg-primary hover:text-white" size="sm" leftIcon={<Edit2 className="w-4 h-4" />}>Update Records</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-8">
                {/* SIDEBAR */}
                <div className="space-y-6">
                    {/* Main Profile Card */}
                    <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

                        <div className="relative flex flex-col items-center text-center space-y-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/5 ring-4 ring-primary/10 shadow-2xl relative">
                                    <Image
                                        src={staff.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.user.name}`}
                                        alt="" width={128} height={128} className="object-cover w-full h-full" unoptimized
                                    />
                                </div>
                                <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#233648] shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">{staff.user.name}</h1>
                                <p className="text-primary text-[11px] font-bold uppercase tracking-[0.2em] mt-1">
                                    {staff.designation} • {staff.department.replace('_', ' ')}
                                </p>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                                    <Badge className="w-3 h-3 p-0" variant="secondary" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID: {staff.employeeId}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full">
                                <Button 
                                    className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 h-12 rounded-2xl" 
                                    leftIcon={<Mail className="w-4 h-4" />}
                                    onClick={() => window.location.href = `mailto:${staff.user.email}`}
                                >
                                    Email
                                </Button>
                                <Button 
                                    className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 h-12 rounded-2xl" 
                                    leftIcon={<Phone className="w-4 h-4" />}
                                    onClick={() => {
                                        if (staff.user.phone) {
                                            window.location.href = `tel:${staff.user.phone}`
                                        } else {
                                            toast.error('No phone number available')
                                        }
                                    }}
                                >
                                    Call
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Contact Info Card */}
                    <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] ml-1">Contact Information</h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                                    <Mail className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Email Address</p>
                                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{staff.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                                    <Phone className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Mobile Phone</p>
                                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{staff.user.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                                    <MapPin className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Home Address</p>
                                    <p className="text-sm font-bold text-white leading-relaxed group-hover:text-primary transition-colors whitespace-pre-wrap">{staff.address || 'Address not listed'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Performance Metrics Sidebar Card */}
                    <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] ml-1">Current Month Performance</h3>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-gray-400">Task Completion</p>
                                    <p className="text-xs font-bold text-white">92%</p>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full w-[92%] shadow-[0_0_10px_rgba(74,158,255,0.5)]" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-gray-400">SLA Adherence</p>
                                    <p className="text-xs font-bold text-white">98%</p>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full w-[98%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="space-y-8">
                    {/* Tabs Navigation */}
                    <div className="bg-[#182433]/40 border border-white/[0.04] p-1 rounded-2xl flex items-center gap-1 shadow-sm backdrop-blur-sm">
                        {tabs.map((tab) => {
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={cn(
                                        "relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-bold transition-all duration-200 uppercase tracking-tighter",
                                        active
                                            ? "bg-[#4A9EFF] text-white shadow-md shadow-[#4A9EFF]/10"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                                    )}
                                >
                                    <tab.icon className={cn("w-3.5 h-3.5 transition-opacity duration-200", active ? "opacity-100" : "opacity-30")} />
                                    <span className="hidden lg:inline whitespace-nowrap">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Tab Panels */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'PERSONAL' && (
                            <div className="space-y-8">
                                <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-10 space-y-12">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Employment Information</h2>
                                        <button onClick={() => setEditModalOpen(true)} className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:brightness-125 transition-all">Update Details</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Department</label>
                                            <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                <p className="text-sm font-bold text-white">{staff.department.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Job Title</label>
                                            <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                <p className="text-sm font-bold text-white">{staff.designation}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Date of Joining</label>
                                            <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                <p className="text-sm font-bold text-white">{new Date(staff.dateOfJoining).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Contract Type</label>
                                            <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                <p className="text-sm font-bold text-white">{staff.contractType || 'Full-Time Permanent'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Reporting Manager</label>
                                            <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                                                    <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.managerName || 'manager'}`} alt="" width={24} height={24} unoptimized />
                                                </div>
                                                <p className="text-sm font-bold text-white">{staff.managerName || 'Michael Scott'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Work Shift</label>
                                            <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                <p className="text-sm font-bold text-white">{staff.workShift || 'Morning (06:00 - 14:00)'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-12 border-t border-white/5 space-y-10">
                                        <h2 className="text-xl font-bold text-white tracking-tight">Emergency Contact</h2>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Contact Name</label>
                                                <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                    <p className="text-sm font-bold text-white">{staff.emergencyContactName || 'Robert Jenkins'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Relationship</label>
                                                <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                    <p className="text-sm font-bold text-white">Spouse</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Emergency Phone</label>
                                                <div className="p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner">
                                                    <p className="text-sm font-bold text-white">{staff.emergencyContactPhone || '+1 (555) 987-6543'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid grid-cols-2 gap-8">
                                    <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-white tracking-tight">Current Salary</h3>
                                            <button
                                                onClick={() => setShowSalary(!showSalary)}
                                                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors"
                                            >
                                                {showSalary ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Monthly gross income</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-white tracking-tighter">
                                                    {showSalary ? `₹${staff.baseSalary.toLocaleString()}` : '•••• ••'}
                                                </span>
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">INR</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-white tracking-tight">Upcoming Leave</h3>
                                            <Calendar className="w-5 h-5 text-gray-600" />
                                        </div>
                                        {staff.leaveRequests?.length > 0 ? (
                                            <div className="space-y-3">
                                                {staff.leaveRequests.slice(0, 3).map((lr: any) => (
                                                    <div key={lr.id} className="flex items-center gap-4 p-4 bg-black/30 border border-white/5 rounded-2xl shadow-inner relative group cursor-pointer hover:border-primary/20 transition-all">
                                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", lr.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20' : lr.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20')}>
                                                            <Clock className={cn("w-5 h-5", lr.status === 'APPROVED' ? 'text-emerald-500' : lr.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500')} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm font-bold text-white">{lr.leaveType} Leave</p>
                                                                <Badge variant={lr.status === 'APPROVED' ? 'success' : lr.status === 'REJECTED' ? 'danger' : 'warning'} className="text-[8px] px-2 py-0">{lr.status}</Badge>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">
                                                                {new Date(lr.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({lr.totalDays} Day{lr.totalDays > 1 ? 's' : ''})
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600 italic py-4">No leave requests found.</p>
                                        )}
                                    </Card>
                                </div>

                                {/* Recent Payments Table - Directly visible in Personal tab as requested by the admin */}
                                <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white tracking-tight">Recent Payment Profile</h2>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Directly showing last 5 payment cycles</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest pl-4">Pay Period</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Base</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Added</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Net Total</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.02]">
                                                {staff.payrolls?.slice(0, 5).map((payroll: any) => (
                                                    <tr key={payroll.id} className="group hover:bg-white/[0.01] transition-colors">
                                                        <td className="py-5 pl-4">
                                                            <p className="text-sm font-bold text-white">{payroll.month} {payroll.year}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-gray-400">Rs. {payroll.baseSalary}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-emerald-500">+Rs. {payroll.incentives + (payroll.bonuses || 0)}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-white tracking-tight">Rs. {payroll.netSalary}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <Badge variant={payroll.status === 'PAID' ? 'success' : 'warning'}>{payroll.status}</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!staff.payrolls || staff.payrolls.length === 0) && (
                                                    <tr>
                                                        <td colSpan={5} className="py-12 text-center text-gray-600 italic">No disbursement history found for this employee yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {staff.payrolls?.length > 5 && (
                                        <div className="pt-4 flex justify-center">
                                            <button 
                                                onClick={() => setActiveTab('PAYROLL')}
                                                className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-primary transition-all underline underline-offset-4"
                                            >
                                                View All Disbursement History →
                                            </button>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {activeTab === 'LEAVE' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Attendance History</h2>
                                        <div className="flex items-center gap-3">
                                            <Button 
                                                onClick={exportToPDF}
                                                variant="secondary" size="sm" leftIcon={<FileText className="w-4 h-4" />}
                                                className="bg-white/5 border-white/5 hover:bg-white/10"
                                            >
                                                Export History (PDF)
                                            </Button>
                                            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Correction Request</Button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest pl-4">Date</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Punch In</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Punch Out</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Worked Hours</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.02]">
                                                {staff.attendances?.length > 0 ? staff.attendances.map((att: any) => (
                                                    <tr key={att.id} className="group hover:bg-white/[0.01] transition-colors">
                                                        <td className="py-5 pl-4">
                                                            <p className="text-sm font-bold text-white">{new Date(att.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-gray-400">{att.punchIn ? new Date(att.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-gray-400">{att.punchOut ? new Date(att.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-white">{att.hoursWorked || '0.0'} hrs</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <Badge variant={att.status === 'PRESENT' ? 'success' : 'danger'} className="text-[10px] font-bold">
                                                                {att.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-12 text-center text-gray-600 italic">No attendance records found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Apply for Leave</h2>
                                        <FileText className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <form className="grid grid-cols-2 gap-8" onSubmit={handleLeaveSubmit}>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Leave Type</label>
                                            <div className="relative group">
                                                <select
                                                    value={leaveForm.leaveType}
                                                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                                    className="w-full bg-[#0a0f14] border border-white/5 rounded-2xl py-4 pl-6 pr-12 text-white font-bold outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer [color-scheme:dark] shadow-inner"
                                                >
                                                    <option value="CASUAL">Casual Leave</option>
                                                    <option value="SICK">Sick Leave</option>
                                                    <option value="EARNED">Earned Leave</option>
                                                    <option value="UNPAID">Unpaid Leave</option>
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={leaveForm.startDate}
                                                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-primary transition-all [color-scheme:dark]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">End Date</label>
                                            <input
                                                type="date"
                                                value={leaveForm.endDate}
                                                min={leaveForm.startDate}
                                                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-primary transition-all [color-scheme:dark]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Reason for Leave</label>
                                            <textarea
                                                value={leaveForm.reason}
                                                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-primary transition-all min-h-[120px] resize-none"
                                                placeholder="Explain your leave requirement..."
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-between pt-4">
                                            {leaveDays > 0 && (
                                                <p className="text-sm font-bold text-gray-400">Duration: <span className="text-white">{leaveDays} day{leaveDays > 1 ? 's' : ''}</span></p>
                                            )}
                                            <Button variant="primary" type="submit" loading={leaveSubmitting} className="px-12 h-14 rounded-2xl shadow-xl shadow-primary/20 ml-auto">Submit Request</Button>
                                        </div>
                                    </form>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'PAYROLL' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Payroll History</h2>
                                        <button 
                                            onClick={exportToPDF}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors group flex items-center gap-2"
                                            title="Export disbursement record to PDF"
                                        >
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Export PDF</span>
                                            <FileText className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest pl-4">Pay Period</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Base</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Incentives</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Net Salary</th>
                                                    <th className="pb-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.02]">
                                                {staff.payrolls?.length > 0 ? staff.payrolls.map((payroll: any) => (
                                                    <tr key={payroll.id} className="group hover:bg-white/[0.01] transition-colors">
                                                        <td className="py-5 pl-4">
                                                            <p className="text-sm font-bold text-white">{payroll.month} {payroll.year}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-gray-400">₹{payroll.baseSalary}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-emerald-500">+₹{payroll.incentives + (payroll.bonuses || 0)}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <p className="text-sm font-bold text-white tracking-tight">₹{payroll.netSalary}</p>
                                                        </td>
                                                        <td className="py-5">
                                                            <Badge variant={payroll.status === 'PAID' ? 'success' : 'warning'}>{payroll.status}</Badge>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-12 text-center text-gray-600 italic">No payroll records found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'PERFORMANCE' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                {staff.performanceScores?.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-8">
                                        <div className="col-span-1 space-y-8">
                                            <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-4">
                                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Overall Rating</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-4xl font-bold text-white tracking-tight">
                                                        {(staff.performanceScores.reduce((acc: any, curr: any) => acc + (curr.avgRating || 0), 0) / staff.performanceScores.length).toFixed(1)}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(s => {
                                                            const avg = (staff.performanceScores.reduce((acc: any, curr: any) => acc + (curr.avgRating || 0), 0) / staff.performanceScores.length);
                                                            return <Star key={s} className={cn("w-4 h-4", s <= Math.round(avg) ? "fill-amber-500 text-amber-500" : "fill-white/10 text-white/10")} />
                                                        })}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-emerald-500">Based on last {staff.performanceScores.length} months</p>
                                            </Card>
                                            <Card className="bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-8 space-y-4">
                                                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Tasks Completed (MTD)</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold text-white tracking-tight">{staff.performanceScores[0].tasksCompleted}</span>
                                                    <span className="text-xs font-bold text-gray-500">/ {staff.performanceScores[0].tasksCompleted + (staff.performanceScores[0].slaBreaches || 0)}</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary" 
                                                        style={{ width: `${(staff.performanceScores[0].tasksCompleted / (staff.performanceScores[0].tasksCompleted + (staff.performanceScores[0].slaBreaches || 0)) * 100) || 0}%` }} 
                                                    />
                                                </div>
                                            </Card>
                                        </div>
                                        <Card className="col-span-2 bg-[#233648]/50 border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white tracking-tight">Performance Analysis</h3>
                                                    <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">Monthly Growth Trend</p>
                                                </div>
                                                <button className="text-gray-600 hover:text-white"><MoreHorizontal /></button>
                                            </div>
                                            <div className="flex items-end gap-12 h-40 pt-10 px-4">
                                                {[...staff.performanceScores].reverse().map((score: any, i: number) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                                        <div className="w-full relative">
                                                            <div 
                                                                className="w-full rounded-t-xl bg-gradient-to-t from-primary/50 to-primary shadow-lg shadow-primary/20 group-hover:brightness-125 transition-all duration-700"
                                                                style={{ height: `${(score.overallScore || score.avgRating * 20 || 0)}%` }}
                                                            >
                                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {score.overallScore || (score.avgRating * 20).toFixed(0)}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{score.month.split('-')[1]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="p-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                            <TrendingUp className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">No Performance Data</h3>
                                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Performance metrics will be automatically generated once the employee begins task processing and service delivery.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* EDIT STAFF MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setEditModalOpen(false)} />
                    <Card className="relative w-full max-w-2xl bg-[#101922] border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-bold text-white">Update Personnel Record</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Editing primary employee data</p>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                {/* Basic Identity */}
                                <div className="space-y-4 col-span-2">
                                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">Primary Identity</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Full Legal Name</label>
                                            <input 
                                                value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Employee ID</label>
                                            <input 
                                                value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Comms */}
                                <div className="space-y-4 col-span-2">
                                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">Communication</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Email Address</label>
                                            <input 
                                                value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Mobile Phone</label>
                                            <input 
                                                value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div className="space-y-4 col-span-2">
                                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">Employment Scope</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Designation / Role</label>
                                            <input 
                                                value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Department</label>
                                            <div className="relative group">
                                                <select 
                                                    value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})}
                                                    className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 pl-5 pr-10 text-sm text-white font-bold focus:border-primary transition-all appearance-none cursor-pointer [color-scheme:dark]"
                                                >
                                                    <option value="MANAGEMENT">Management</option>
                                                    <option value="RECEPTION">Reception</option>
                                                    <option value="HOUSEKEEPING">Housekeeping</option>
                                                    <option value="MAINTENANCE">Maintenance</option>
                                                    <option value="KITCHEN">Kitchen</option>
                                                    <option value="SERVICE">Service</option>
                                                    <option value="SECURITY">Security</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Monthly Base Salary (₹)</label>
                                            <input 
                                                type="number" value={editForm.baseSalary} onChange={e => setEditForm({...editForm, baseSalary: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Joining Date</label>
                                            <input 
                                                type="date" value={editForm.dateOfJoining} onChange={e => setEditForm({...editForm, dateOfJoining: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner [color-scheme:dark]" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address & Location */}
                                <div className="space-y-4 col-span-2">
                                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">Localization</h3>
                                    <div className="space-y-2">
                                         <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Personal Home Address</label>
                                         <textarea 
                                             value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})}
                                             rows={2}
                                             className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner resize-none" 
                                             placeholder="Enter full residential address..."
                                         />
                                    </div>
                                </div>

                                {/* Operational Status */}
                                <div className="space-y-4 col-span-2">
                                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">Operational Status</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Contract Type</label>
                                            <input 
                                                value={editForm.contractType} onChange={e => setEditForm({...editForm, contractType: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Work Shift</label>
                                            <input 
                                                value={editForm.workShift} onChange={e => setEditForm({...editForm, workShift: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Reporting Manager Name</label>
                                            <input 
                                                value={editForm.managerName} onChange={e => setEditForm({...editForm, managerName: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Account Status</label>
                                            <div className="relative group">
                                                <select 
                                                    value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                                                    className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 pl-5 pr-10 text-sm text-white font-bold focus:border-primary transition-all appearance-none cursor-pointer [color-scheme:dark]"
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="INACTIVE">Inactive</option>
                                                    <option value="SUSPENDED">Suspended</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="space-y-4 col-span-2">
                                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest">Emergency Protocol</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Emergency Contact Name</label>
                                            <input 
                                                value={editForm.emergencyContactName} onChange={e => setEditForm({...editForm, emergencyContactName: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Emergency Contact Phone</label>
                                            <input 
                                                value={editForm.emergencyContactPhone} onChange={e => setEditForm({...editForm, emergencyContactPhone: e.target.value})}
                                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white font-bold focus:border-primary transition-all shadow-inner" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)} className="flex-1 h-14 rounded-2xl">Cancel</Button>
                                <Button type="submit" variant="primary" loading={isUpdating} className="flex-1 h-14 rounded-2xl shadow-xl shadow-primary/20" leftIcon={<Save className="w-4 h-4" />}>
                                    Save Record
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}
