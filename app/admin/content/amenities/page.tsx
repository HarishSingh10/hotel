'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Wifi, Coffee, Dumbbell, Car, Tv, Utensils } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

// Helper to render dynamic icons
const IconMap: any = {
    Wifi, Coffee, Dumbbell, Car, Tv, Utensils
}

export default function AmenitiesPage() {
    const [amenities, setAmenities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ name: '', icon: 'Wifi', description: '', category: 'General' })

    const fetchAmenities = async () => {
        try {
            const res = await fetch('/api/admin/content/amenities')
            if (res.ok) {
                const data = await res.json()
                setAmenities(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAmenities()
    }, [])

    const handleSubmit = async () => {
        if (!formData.name) return toast.error('Name is required')

        try {
            const res = await fetch('/api/admin/content/amenities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success('Amenity added')
                fetchAmenities()
                setShowForm(false)
                setFormData({ name: '', icon: 'Wifi', description: '', category: 'General' })
            } else {
                toast.error('Failed to add')
            }
        } catch (e) {
            toast.error('Error submitting')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        // Logic for delete would go here (API endpoint needed in real app)
        // For MVP demo we'll just filter local state if API wasn't implemented
        toast.success('Deleted (Simulated)')
        setAmenities(prev => prev.filter(a => a.id !== id))
    }

    const IconComponent = IconMap[formData.icon] || Wifi

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Amenities</h1>
                    <p className="text-text-secondary mt-1">Manage hotel features and services</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                    Add New Amenity
                </Button>
            </div>

            {/* Add Form Modal/Card */}
            {showForm && (
                <Card className="mb-6 border-primary/30 bg-primary/5">
                    <h3 className="font-bold mb-4">Add New Amenity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Icon</label>
                            <select
                                className="input"
                                value={formData.icon}
                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                            >
                                {Object.keys(IconMap).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Category"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        />
                        <Input
                            label="Description"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>Save Amenity</Button>
                    </div>
                </Card>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {amenities.map(amenity => {
                    const Icon = IconMap[amenity.icon] || Wifi
                    return (
                        <Card key={amenity.id} className="group hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-white/10 rounded text-text-secondary hover:text-primary">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 hover:bg-white/10 rounded text-text-secondary hover:text-red-500"
                                        onClick={() => handleDelete(amenity.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-text-primary text-lg">{amenity.name}</h3>
                            <p className="text-xs text-primary font-medium mb-2 uppercase tracking-wide">{amenity.category}</p>
                            <p className="text-sm text-text-secondary truncate">{amenity.description}</p>
                        </Card>
                    )
                })}

                {/* Empty State */}
                {!loading && amenities.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-secondary bg-surface/30 rounded-xl border border-dashed border-border">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wifi className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <p>No amenities found. Add your first one above.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
