"use client";

import { useEffect, useState } from "react";
import { 
    getMenuItems, 
    createMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    MenuItem,
    getCategories,
    MenuCategory
} from "@/services/menu.service";

export default function MenuItemsCRUDPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: "",
        description: "",
        category_id: "",
        base_unit: "portion",
        min_quantity: 1,
        is_customizable: false,
        is_active: true
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedItems, fetchedCats] = await Promise.all([
                getMenuItems(),
                getCategories().catch(() => []) // Fallback if categories endpoint fails
            ]);
            setItems(fetchedItems || []);
            setCategories(fetchedCats || []);
        } catch (err: any) {
            console.error("Failed to load items:", err);
            setError("Failed to fetch data from the server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            description: "",
            category_id: categories.length > 0 ? categories[0].id : "",
            base_unit: "portion",
            min_quantity: 1,
            is_customizable: false,
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
        
        try {
            await deleteMenuItem(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete item. It may be linked to specific recipes or orders.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            if (editingItem && editingItem.id) {
                // Update
                const updated = await updateMenuItem(editingItem.id, formData);
                setItems(prev => prev.map(item => item.id === editingItem.id ? updated : item));
            } else {
                // Create
                const created = await createMenuItem(formData);
                setItems(prev => [created, ...prev]);
            }
            closeModal();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to save menu item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading CRUD interface...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Manage Menu Items</h1>
                    <p className="text-gray-500 text-sm mt-1">Full CRUD dashboard to create, update, and remove culinary offerings</p>
                </div>
                
                <button 
                    onClick={openCreateModal}
                    className="bg-[#689F38] hover:bg-[#558B2F] text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-[#689F38]/20 flex items-center gap-2 transform active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    New Item
                </button>
            </div>

            {/* Data Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {items.length === 0 ? (
                        <div className="p-12 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No items exist in the database</h3>
                            <p className="text-gray-500 mb-6">Click "New Item" to seed the database.</p>
                            <button onClick={openCreateModal} className="text-[#689F38] font-bold underline hover:text-[#558B2F]">Create your first item</button>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Internal ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Settings</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">CRUD Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                                            {item.id.split('-')[0]}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500 truncate w-48">{item.description}</div>
                                            <div className="mt-1 text-xs text-[#689F38] font-medium">Category: {item.category_id ? "Linked" : "None"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-gray-600 border border-gray-200 px-2 rounded w-max">Unit: {item.base_unit}</span>
                                                <span className="text-xs text-gray-600 border border-gray-200 px-2 rounded w-max">Min Qty: {item.min_quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => openEditModal(item)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md transition-colors mr-2 font-bold"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-md transition-colors font-bold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-extrabold text-gray-900">
                                {editingItem ? "Update Menu Item" : "Create New Menu Item"}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {error && (
                                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
                                    {error}
                                </div>
                            )}

                            <form id="crud-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name || ""}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors text-gray-900 placeholder-gray-500 bg-white"
                                        placeholder="e.g. Garlic Naan"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                    <textarea 
                                        value={formData.description || ""}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors h-24 resize-none text-gray-900 placeholder-gray-500 bg-white"
                                        placeholder="Provide a delicious description..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Base Unit</label>
                                        <select 
                                            value={formData.base_unit || "portion"}
                                            onChange={e => setFormData({...formData, base_unit: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white"
                                        >
                                            <option value="portion">Portion</option>
                                            <option value="piece">Piece</option>
                                            <option value="kg">Kilogram</option>
                                            <option value="plate">Plate</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Min Quantity</label>
                                        <input 
                                            type="number" 
                                            min="1" step="0.5"
                                            value={formData.min_quantity || 1}
                                            onChange={e => setFormData({...formData, min_quantity: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.is_customizable || false}
                                            onChange={e => setFormData({...formData, is_customizable: e.target.checked})}
                                            className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]/50"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Customizable</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.is_active || false}
                                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                            className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]/50"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Active</span>
                                    </label>
                                </div>
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={closeModal}
                                type="button"
                                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                form="crud-form"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-[#689F38] text-white rounded-lg hover:bg-[#558B2F] font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center justify-center min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    editingItem ? "Save Changes" : "Create Item"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
