'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, Tag, DollarSign, Image as ImageIcon } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export default function MenuPage() {
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        isVeg: true,
        image: '' as string
    })

    const categories = ['All', 'Breakfast', 'Main Course', 'Appetizers', 'Desserts', 'Beverages']

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/admin/content/menu')
            if (res.ok) setMenuItems(await res.json())
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMenu()
    }, [])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const filteredItems = selectedCategory === 'All'
        ? menuItems
        : menuItems.filter(i => i.category === selectedCategory)

    // Simplified submit handler for demo
    const handleSubmit = () => {
        // Here we would POST to /api/admin/content/menu
        toast.success('Menu item saved (Simulation)')
        setShowForm(false)
        // Optimistic update
        setMenuItems(prev => [...prev, { ...formData, id: Date.now().toString(), price: parseFloat(formData.price) }])
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Restaurant Menu</h1>
                    <p className="text-text-secondary mt-1">Curate your digital dining experience</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                    Add Item
                </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-surface border border-white/10 text-text-secondary hover:bg-surface-hover'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {showForm && (
                <Card className="mb-6 border-primary/30">
                    <h3 className="font-bold mb-4">New Menu Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Input label="Item Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <Input label="Price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isVeg}
                                    onChange={e => setFormData({ ...formData, isVeg: e.target.checked })}
                                    id="veg-check"
                                    className="rounded bg-surface border-border text-green-500 focus:ring-green-500"
                                />
                                <label htmlFor="veg-check" className="text-sm text-text-primary">Vegetarian</label>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-text-secondary">Item Image</label>
                            <div className="border-2 border-dashed border-border rounded-xl aspect-video flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                                {formData.image ? (
                                    <Image src={formData.image} alt="Preview" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="text-center text-text-tertiary">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-xs">Click to upload</p>
                                    </div>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                            </div>
                            <textarea
                                placeholder="Description..."
                                className="input min-h-[80px]"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                        <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>Save Item</Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    <Card key={item.id} className="group p-0 overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all">
                        <div className="bg-surface-light h-48 w-full relative">
                            {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <Utensils className="w-12 h-12 text-text-tertiary opacity-20" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <Badge variant={item.isVeg ? 'success' : 'danger'}>
                                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-text-primary text-lg">{item.name}</h3>
                                <span className="font-mono font-bold text-primary">{formatCurrency(item.price)}</span>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">{item.description}</p>
                            <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                                <Button variant="ghost" size="sm" className="flex-1">Edit</Button>
                                <button className="p-2 text-text-tertiary hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function Utensils(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    )
}
