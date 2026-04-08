'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, Tag, IndianRupee, Image as ImageIcon, ChevronLeft, ChevronRight, Utensils, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/lib/utils'

export default function MenuPage() {
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        id: '' as string | undefined,
        name: '',
        description: '',
        price: '',
        margin: '',
        category: 'Main Course',
        isVeg: true,
        images: [] as string[]
    })

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 6

    const categories = ['All', 'Breakfast', 'Main Course', 'Appetizers', 'Desserts', 'Beverages']

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/admin/content/menu')
            if (res.ok) {
                const data = await res.json()
                setMenuItems(Array.isArray(data.menuItems) ? data.menuItems : [])
            } else {
                setMenuItems([])
            }
        } catch (error) {
            console.error('[MENU_FETCH_ERROR]', error)
            setMenuItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMenu()
    }, [])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setFormData(prev => ({ 
                        ...prev, 
                        images: [...prev.images, reader.result as string] 
                    }))
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    // CRUD Operations
    const handleSubmit = async () => {
        if (!formData.name || !formData.price) {
            toast.error('Item name and price are required')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/admin/content/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(formData.id ? 'Item updated successfully' : 'New item created')
                setShowForm(false)
                fetchMenu()
                setFormData({ id: '', name: '', description: '', price: '', margin: '', category: 'Main Course', isVeg: true, images: [] })
            } else {
                toast.error('Failed to save menu item')
            }
        } catch (error) {
            toast.error('Network error. Failed to save.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return

        try {
            const res = await fetch(`/api/admin/content/menu?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Item removed')
                fetchMenu()
            } else {
                toast.error('Failed to delete item')
            }
        } catch (error) {
            toast.error('Error deleting item')
        }
    }

    const handleEdit = (item: any) => {
        setFormData({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            margin: item.margin ? item.margin.toString() : '0',
            category: item.category,
            isVeg: item.isVeg,
            images: item.images || []
        })
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Filter and Pagination Logic
    const filteredItems = menuItems.filter(i => {
        const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory
        return matchesCategory
    })

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    useEffect(() => {
        setCurrentPage(1) // Reset to page 1 when filter changes
    }, [selectedCategory])

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
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Sale Price (Rs.)" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                <Input label="Profit Margin (Rs.)" type="number" value={formData.margin} onChange={e => setFormData({ ...formData, margin: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                <div className="relative group">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer [color-scheme:dark]"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c} className="bg-[#111827]">
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-primary transition-colors rotate-90" />
                                </div>
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
                            <label className="block text-sm font-medium text-text-secondary">Item Images</label>
                            <div className="grid grid-cols-3 gap-2">
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square border border-white/10 rounded-lg overflow-hidden group">
                                        <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" unoptimized />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <div className="border-2 border-dashed border-border rounded-lg aspect-square flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    <div className="text-center text-text-tertiary">
                                        <Plus className="w-6 h-6 mx-auto mb-1" />
                                        <p className="text-[10px]">Add</p>
                                    </div>
                                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                                </div>
                            </div>
                            <textarea
                                placeholder="Description..."
                                className="input min-h-[80px]"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
                        <Button variant="ghost" onClick={() => {
                            setShowForm(false)
                            setFormData({ id: '', name: '', description: '', price: '', margin: '', category: 'Main Course', isVeg: true, images: [] })
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} className="px-10 h-12 shadow-xl shadow-primary/20">
                            {formData.id ? 'Update Item' : 'Create Item'}
                        </Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map(item => (
                    <Card key={item.id} className="group p-0 overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all relative border-white/[0.03] bg-surface/50 backdrop-blur-sm">
                        <div className="bg-surface-light h-48 w-full relative">
                            {item.images && item.images.length > 0 ? (
                                <Image src={item.images[0]} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <Utensils className="w-12 h-12 text-text-tertiary opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3 z-10">
                                <Badge variant={item.isVeg ? 'success' : 'danger'} className="text-[9px] font-black px-3">
                                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                                </Badge>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {item.images && item.images.length > 1 && (
                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] font-bold text-white z-10">
                                    +{item.images.length - 1} Images
                                </div>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-text-primary text-xl tracking-tight">{item.name}</h3>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono font-black text-primary text-lg">Rs. {item.price}</span>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">{item.category}</span>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-6 flex-1">{item.description}</p>
                            <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-auto">
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="flex-1 h-10 rounded-xl bg-white/5 border-white/5 hover:bg-white/10"
                                    onClick={() => handleEdit(item)}
                                >
                                    Quick Edit
                                </Button>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all shadow-inner"
                                    title="Delete Item"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-8 py-12">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-12 h-12 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-inner"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx + 1)}
                                className={cn(
                                    "w-10 h-10 rounded-xl text-xs font-black transition-all",
                                    currentPage === idx + 1 
                                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                        : "text-gray-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-12 h-12 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-inner"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}

