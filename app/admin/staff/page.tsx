'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/common/Avatar'
import { Plus, Search, MapPin, Phone, Mail, FileText, XCircle, Filter, Download, Info } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { toast } from 'sonner'
import { buildContextUrl, getAdminContext } from '@/lib/admin-context'
import { downloadCSV } from '@/lib/csv'

export default function StaffPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const userRole = session?.user?.role || 'STAFF'

    const [showAddModal, setShowAddModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filtering States
    const [searchQuery, setSearchQuery] = useState('')
    const [filterDept, setFilterDept] = useState('ALL')
    const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFICATION'>('ALL')
    const [idProofModal, setIdProofModal] = useState<string | null>(null)

    // Form State for Add/Edit
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: 'FRONT_DESK',
        role: 'Receptionist',
        salary: '0',
        password: '',
        userRole: 'STAFF'
    })

    const { data: rawStaff, mutate, isValidating: loading } = useSWR(buildContextUrl('/api/admin/staff'), (url) => fetch(url).then(res => res.json()), {
        revalidateOnFocus: true,
        dedupingInterval: 5000
    })

    const staffList = Array.isArray(rawStaff) ? rawStaff : (rawStaff?.data ?? [])

    const fetchStaff = () => mutate()

    // Derived filtered list
    const filteredStaff = useMemo(() => {
        return staffList.filter((s: any) => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.department || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDept = filterDept === 'ALL' || s.department === filterDept;
            const matchesTab = activeTab === 'ALL' || (activeTab === 'VERIFICATION' && s.verificationRequested);
            return matchesSearch && matchesDept && matchesTab;
        });
    }, [staffList, searchQuery, filterDept, activeTab]);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Use session propertyId for non-super-admins, localStorage for super-admin
        const propertyId = session?.user?.role === 'SUPER_ADMIN'
            ? getAdminContext().propertyId
            : session?.user?.propertyId

        try {
            const res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    salary: parseFloat(formData.salary),
                    propertyId: propertyId && propertyId !== 'ALL' ? propertyId : undefined
                })
            })

            if (res.ok) {
                toast.success('Staff member added successfully')
                setShowAddModal(false)
                fetchStaff()
                setFormData({
                    name: '', email: '', phone: '', department: 'FRONT_DESK', role: 'Receptionist', salary: '0', password: '', userRole: 'STAFF'
                })
            } else {
                const error = await res.text()
                toast.error(error || 'Failed to add staff')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteStaff = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) return

        try {
            const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Staff member removed')
                fetchStaff()
            } else {
                toast.error('Failed to remove staff')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    const handleExport = () => {
        if (filteredStaff.length === 0) {
            toast.error('No data to export');
            return;
        }
        downloadCSV(filteredStaff.map((s: any) => ({
            Name: s.name,
            Email: s.email,
            Phone: s.phone,
            Department: s.department,
            Role: s.role,
            Salary: s.salary,
            Status: s.dutyStatus
        })), 'Staff_Directory');
        toast.success('Staff list exported to CSV');
    };

    const handleVerifyAction = async (staffId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetch('/api/admin/staff/verify', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId, action })
            })
            if (res.ok) {
                toast.success(`Staff verification ${action === 'APPROVE' ? 'approved' : 'rejected'}`)
                fetchStaff()
            }
        } catch (error) {
            toast.error('Failed to verify staff')
        }
    }

    const viewStaffDetails = (staff: any) => {
        router.push(`/admin/staff/${staff.id}`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Staff Management</h1>
                    <p className="text-text-secondary mt-1">Manage employees, departments, and roles</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                    Add Employee
                </Button>
            </div>

            {/* Add Employee Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => !isSubmitting && setShowAddModal(false)}
                title="Add New Employee"
                description="Create a new staff account and profile"
                size="lg"
            >
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@zenbourg.com"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="9876543210"
                            required
                        />
                        <Input
                            label="Password (Default: 123456)"
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Department"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            options={[
                                { value: 'FRONT_DESK', label: 'Front Desk' },
                                { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                                { value: 'KITCHEN', label: 'Kitchen' },
                                { value: 'MAINTENANCE', label: 'Maintenance' },
                                { value: 'SECURITY', label: 'Security' },
                            ]}
                        />
                        <Input
                            label="Designation/Role"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            placeholder="Chef / Manager / Waiter"
                            required
                        />
                    </div>
                    {['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(userRole) && (
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="System Role (Permissions)"
                                value={formData.userRole}
                                onChange={e => setFormData({ ...formData, userRole: e.target.value })}
                                options={[
                                    { value: 'MANAGER', label: 'Hotel Manager / Reception' },
                                    { value: 'STAFF', label: 'General Staff' },
                                ]}
                            />
                            <Input
                                label="Monthly Base Salary"
                                type="number"
                                value={formData.salary}
                                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                placeholder="5000"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={isSubmitting}>Create Account</Button>
                    </div>
                </form>
            </Modal>



            {/* Staff List */}
            <Card className="bg-surface border-white/[0.08] overflow-hidden">
                <div className="flex gap-4 border-b border-white/[0.08] bg-white/[0.02]">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={cn(
                            "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                            activeTab === 'ALL' ? "text-primary border-b-2 border-primary" : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        Full Roster
                    </button>
                    <button
                        onClick={() => setActiveTab('VERIFICATION')}
                        className={cn(
                            "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2",
                            activeTab === 'VERIFICATION' ? "text-primary border-b-2 border-primary" : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        Verification Tasks
                        {staffList.filter((s: any) => s.verificationRequested).length > 0 && (
                            <span className="w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                                {staffList.filter((s: any) => s.verificationRequested).length}
                            </span>
                        )}
                    </button>
                </div>
                <div className="p-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            placeholder="Search staff by name or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary placeholder:text-text-tertiary transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            options={[
                                { value: 'ALL', label: 'All Departments' },
                                { value: 'FRONT_DESK', label: 'Front Desk' },
                                { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                                { value: 'KITCHEN', label: 'Kitchen' },
                                { value: 'MAINTENANCE', label: 'Maintenance' },
                                { value: 'SECURITY', label: 'Security' },
                            ]}
                            className="w-40 h-9 text-xs"
                        />
                        <Button
                            variant="secondary"
                            className="bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1] h-9"
                            leftIcon={<Download className="w-4 h-4" />}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                    </div>
                </div>

                <div className="divide-y divide-white/[0.04]">
                    {loading ? (
                        <div className="p-12 text-center text-text-secondary animate-pulse">Loading staff directory...</div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="p-12 text-center text-text-tertiary ">
                            No staff members found matching your search.
                        </div>
                    ) : (
                        filteredStaff.map((staff: any) => (
                            <div key={staff.id} onClick={() => viewStaffDetails(staff)} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <Avatar name={staff.name} />
                                    <div>
                                        <h3 className="font-semibold text-text-primary">{staff.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">{staff.department}</span>
                                            <span className="text-xs text-text-tertiary">• {staff.role}</span>
                                            {staff.isVerified && <Badge variant="success" className="text-[8px] h-4">Verified</Badge>}
                                            {staff.verificationRequested && <Badge variant="warning" className="text-[8px] h-4">Requested</Badge>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="hidden lg:flex flex-col gap-1 w-48">
                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                            <Phone className="w-3 h-3 opacity-50" /> {staff.phone || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary truncate">
                                            <Mail className="w-3 h-3 opacity-50" /> {staff.email}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1 justify-end">
                                            <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px] ${staff.dutyStatus === 'ON_DUTY'
                                                ? 'bg-emerald-500 shadow-emerald-500/50'
                                                : staff.dutyStatus === 'PUNCHED_OUT'
                                                    ? 'bg-amber-500 shadow-amber-500/50'
                                                    : 'bg-gray-500 shadow-gray-500/50'
                                                }`} />
                                            <span className="text-xs font-semibold tracking-wide text-text-secondary whitespace-nowrap">
                                                {staff.dutyStatus === 'ON_DUTY' ? 'ON DUTY' : staff.dutyStatus === 'PUNCHED_OUT' ? 'PUNCHED OUT' : 'OFF DUTY'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-text-tertiary justify-end uppercase tracking-wider">
                                            <MapPin className="w-3 h-3" />
                                            {staff.location || 'HQ'}
                                        </div>
                                    </div>

                                    {/* Financials - OWNER & SUPER ADMIN */}
                                    {['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(userRole) && (
                                        <div className="text-right border-l border-white/[0.08] pl-8 w-32 hidden sm:block">
                                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Salary</p>
                                            <p className="font-bold text-text-primary font-mono text-lg">₹{staff.salary}</p>
                                        </div>
                                    )}

                                    <div className="w-48 flex justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 gap-2">
                                        {staff.verificationRequested && (
                                            <>
                                                {/* ID proof thumbnail */}
                                                {(staff.documents as any)?.idProofImage && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setIdProofModal((staff.documents as any).idProofImage) }}
                                                        title="View ID proof"
                                                        className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-blue-400/50 transition-all shrink-0"
                                                    >
                                                        <img
                                                            src={(staff.documents as any).idProofImage}
                                                            alt="ID"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white border-emerald-500/20 text-[10px]"
                                                    onClick={(e) => { e.stopPropagation(); handleVerifyAction(staff.id, 'APPROVE') }}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/20 text-[10px]"
                                                    onClick={(e) => { e.stopPropagation(); handleVerifyAction(staff.id, 'REJECT') }}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 hover:bg-white/[0.1] text-text-secondary"
                                            onClick={() => viewStaffDetails(staff)}
                                        >
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                        {(session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'HOTEL_ADMIN') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-danger/10 text-danger/70 hover:text-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteStaff(staff.id);
                                                }}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>

        {/* ID Proof Image Modal */}
        {idProofModal && (
            <div
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIdProofModal(null)}
            >
                <div
                    className="relative max-w-lg w-full bg-[#161b22] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <p className="text-sm font-bold text-white">ID Proof Document</p>
                        <button
                            onClick={() => setIdProofModal(null)}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4">
                        <img
                            src={idProofModal}
                            alt="ID Proof"
                            className="w-full rounded-2xl object-contain max-h-[70vh]"
                        />
                    </div>
                </div>
            </div>
        )}
    )
}
