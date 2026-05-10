"use client";

import { useEffect, useState } from "react";
import { getMenuItems, getCategories, createMenuItem, updateMenuItem, deleteMenuItem, MenuItem, MenuCategory } from "@/services/menu.service";
import theme from "@/utils/theme";

export default function MenuListingPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: "",
        description: "",
        base_unit: "plate",
        min_quantity: "",
        image_url: "",
        category_id: "",
        is_customizable: false,
        is_active: true
    });

    const fetchMenu = async () => {
        setIsLoading(true);
        try {
            const [itemsData, catsData] = await Promise.all([
                getMenuItems(),
                getCategories().catch(() => [])
            ]);
            setItems(itemsData || []);
            setCategories(catsData || []);
        } catch (err: any) {
            console.error("Failed to load menu UI:", err);
            setError("Failed to fetch menu items from the database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleOpenModal = (item?: MenuItem) => {
        if (item) {
            setSelectedItem(item);
            setFormData({
                name: item.name,
                description: item.description,
                base_unit: item.base_unit,
                min_quantity: item.min_quantity,
                image_url: item.image_url || "",
                category_id: item.category_id,
                is_customizable: item.is_customizable,
                is_active: item.is_active
            });
        } else {
            setSelectedItem(null);
            setFormData({
                name: "",
                description: "",
                base_unit: "plate",
                min_quantity: "",
                image_url: "",
                category_id: categories.length > 0 ? categories[0].id : "",
                is_customizable: false,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Frontend validation: description is mandatory
        if (!formData.description || formData.description.trim().length === 0) {
            alert("Description is required. Please provide a short description before saving.");
            return;
        }

        if (formData.min_quantity === "" || isNaN(Number(formData.min_quantity))) {
            alert("Please enter a valid Minimum Quantity.");
            return;
        }

        setIsSubmitting(true);
        
        const payload = {
            ...formData,
            name: formData.name?.trim(),
            description: formData.description.trim()
        };

        try {
            if (selectedItem) {
                await updateMenuItem(selectedItem.id, payload);
            } else {
                await createMenuItem(payload);
            }
            setIsModalOpen(false);
            await fetchMenu();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "An error occurred while saving the menu item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this menu item?")) {
            try {
                await deleteMenuItem(id);
                await fetchMenu();
            } catch (err: any) {
                console.error(err);
                alert(err.response?.data?.message || "Failed to delete item.");
            }
        }
    };

    if (isLoading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading recipe catalogues...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Menu Master</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and audit your active culinary offerings</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search dishes..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38] focus:border-transparent transition-shadow w-full md:w-64 text-gray-900 placeholder-gray-500 bg-white"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-[#689F38] hover:bg-[#558B2F] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-red-800 font-bold text-lg">Menu Synchronization Error</h3>
                    </div>
                    <p className="text-red-700 mt-2 ml-9">{error}</p>
                    <button 
                        onClick={fetchMenu}
                        className="mt-4 ml-9 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Menu Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredItems.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50/50">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Menu Items Found</h3>
                            <p className="text-gray-500">
                                {searchQuery ? "No dishes matched your search criteria." : "Your catalog is empty. Start by adding a new culinary item."}
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#fdf0e8]/30">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Dish</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Serving Logic</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customizable</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {item.image_url ? (
                                                        <img className="h-10 w-10 rounded-lg object-cover" src={item.image_url} alt="" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                                            <span className="text-emerald-700 font-bold text-lg">
                                                                {item.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500 truncate w-48">{item.description || "No description provided"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">Per {item.base_unit}</div>
                                            <div className="text-xs text-gray-500">Min Order: {item.min_quantity}</div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.is_customizable ? (
                                                <span className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex text-xs font-semibold text-gray-500 px-2.5 py-0.5">
                                                    No
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#689F38]/10 text-[#558B2F]">
                                                    <span className="w-2 h-2 rounded-full bg-[#689F38] mr-1.5 align-middle"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                    <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5 align-middle"></span>
                                                    Hidden
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a 
                                                href={`/dashboard/menu/${item.id}/recipe`}
                                                className="text-amber-600 hover:text-amber-800 bg-transparent hover:bg-amber-50 px-2 py-1 rounded transition-colors mr-2 inline-block"
                                            >
                                                Recipe
                                            </a>
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="text-[#689F38] hover:text-[#558B2F] bg-transparent hover:bg-[#689F38]/10 px-2 py-1 rounded transition-colors mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-500 hover:text-red-700 bg-transparent hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                            >
                                                Del
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- ADD/EDIT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">{selectedItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>
                                <p className="text-sm text-gray-500 font-medium">{selectedItem ? "Update culinary details" : "Create a new culinary item"}</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="menu-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-gray-700">Item Name <span className="text-red-500">*</span></label>
                                        <span className={`text-xs font-medium ${ (formData.name?.length || 0) >= 20 ? 'text-red-500' : 'text-gray-400' }`}>
                                            {formData.name?.length || 0}/25
                                        </span>
                                    </div>
                                    <input type="text" required minLength={2} maxLength={25} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. Mutton Biryani" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <select required value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white">
                                        <option value="" disabled>Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-gray-700">Description <span className="text-red-500">*</span></label>
                                        <span className={`text-xs font-medium ${ (formData.description?.length || 0) >= 90 ? 'text-red-500' : (formData.description?.length || 0) >= 80 ? 'text-amber-500' : 'text-gray-400' }`}>
                                            {formData.description?.length || 0}/100
                                        </span>
                                    </div>
                                    <textarea
                                        required
                                        maxLength={100}
                                        value={formData.description || ''}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors h-20 resize-none text-sm text-gray-900 placeholder-gray-500 bg-white"
                                        placeholder="A brief description of the dish (required)..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Base Unit</label>
                                        <select required value={formData.base_unit || ''} onChange={e => setFormData({...formData, base_unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white">
                                            <option value="plate">Plate</option>
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="piece">Piece</option>
                                            <option value="serving">Serving</option>
                                            <option value="box">Box</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Min Quantity</label>
                                        <input type="number" required min="1" step="0.5" value={formData.min_quantity} onChange={e => setFormData({...formData, min_quantity: e.target.value === "" ? "" : parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Image URL <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                                    <input type="url" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors text-gray-900 placeholder-gray-500 bg-white" placeholder="https://example.com/image.jpg" />
                                </div>

                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.is_customizable || false} onChange={e => setFormData({...formData, is_customizable: e.target.checked})} className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]" />
                                        <span className="text-sm font-bold text-gray-700">Is this dish customizable by customers?</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.is_active ?? true} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]" />
                                        <span className="text-sm font-bold text-gray-700">Active (Visible in menus)</span>
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={handleCloseModal} type="button" className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold transition-colors">Cancel</button>
                            <button type="submit" form="menu-form" disabled={isSubmitting} className="px-6 py-2 bg-[#689F38] hover:bg-[#558B2F] text-white rounded-lg font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center justify-center min-w-[120px]">
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (selectedItem ? "Save Changes" : "Create Item")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
