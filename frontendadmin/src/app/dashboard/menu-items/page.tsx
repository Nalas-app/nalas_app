"use client";

import { useEffect, useState } from "react";
import { 
    getMenuItems, 
    createMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    getRecipe,
    addRecipeIngredient,
    removeRecipeIngredient,
    RecipeIngredient,
    RecipePayload,
    MenuItem,
    getCategories,
    MenuCategory
} from "@/services/menu.service";
import { getAllStockLevels, StockLevel } from "@/services/stock.service";

export default function MenuItemsCRUDPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    // Recipe Modal State
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [selectedRecipeItem, setSelectedRecipeItem] = useState<MenuItem | null>(null);
    const [currentRecipe, setCurrentRecipe] = useState<RecipeIngredient[]>([]);
    const [availableIngredients, setAvailableIngredients] = useState<StockLevel[]>([]);
    const [recipeFormData, setRecipeFormData] = useState<RecipePayload>({
        ingredient_id: "",
        quantity_per_base_unit: 0,
        wastage_factor: 1.05
    });
    const [isRecipeSubmitting, setIsRecipeSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: "",
        description: "",
        category_id: "",
        base_unit: "serving",
        min_quantity: 1,
        base_price: 0,
        is_customizable: false,
        is_active: true
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedItems, fetchedCats, fetchedStock] = await Promise.all([
                getMenuItems(),
                getCategories().catch(() => []), // Fallback if categories endpoint fails
                getAllStockLevels().catch(() => []) // Fallback
            ]);
            setItems(fetchedItems || []);
            setCategories(fetchedCats || []);
            setAvailableIngredients(fetchedStock || []);
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
            base_unit: "serving",
            min_quantity: 1,
            base_price: 0,
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

    const openRecipeModal = async (item: MenuItem) => {
        setSelectedRecipeItem(item);
        setRecipeFormData({
            ingredient_id: availableIngredients.length > 0 ? availableIngredients[0].ingredient_id : "",
            quantity_per_base_unit: 0,
            wastage_factor: 1.05
        });
        setIsRecipeModalOpen(true);
        // Fetch recipe
        try {
            const recipe = await getRecipe(item.id);
            setCurrentRecipe(recipe);
        } catch (err) {
            console.error("Failed to fetch recipe", err);
            setCurrentRecipe([]);
        }
    };

    const closeRecipeModal = () => {
        setIsRecipeModalOpen(false);
        setSelectedRecipeItem(null);
    };

    const handleAddRecipeIngredient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecipeItem) return;
        setIsRecipeSubmitting(true);
        try {
            await addRecipeIngredient(selectedRecipeItem.id, recipeFormData);
            // Refresh recipe
            const recipe = await getRecipe(selectedRecipeItem.id);
            setCurrentRecipe(recipe);
            setRecipeFormData({ ...recipeFormData, quantity_per_base_unit: 0 }); // reset qty
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to add ingredient to recipe.");
        } finally {
            setIsRecipeSubmitting(false);
        }
    };

    const handleRemoveRecipeIngredient = async (ingredientId: string) => {
        if (!selectedRecipeItem) return;
        if (!window.confirm("Remove this ingredient from the recipe?")) return;
        try {
            await removeRecipeIngredient(selectedRecipeItem.id, ingredientId);
            const recipe = await getRecipe(selectedRecipeItem.id);
            setCurrentRecipe(recipe);
        } catch (err: any) {
            console.error(err);
            alert("Failed to remove ingredient.");
        }
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
                                                <span className="text-xs text-[#689F38] border border-[#689F38]/30 px-2 rounded w-max font-bold">₹{item.base_price || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => openRecipeModal(item)}
                                                className="text-amber-600 hover:text-amber-900 bg-amber-50 px-3 py-1.5 rounded-md transition-colors mr-2 font-bold"
                                            >
                                                Recipe
                                            </button>
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
                                            value={formData.base_unit || "serving"}
                                            onChange={e => setFormData({...formData, base_unit: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white"
                                        >
                                            <option value="serving">Serving</option>
                                            <option value="piece">Piece</option>
                                            <option value="kg">Kilogram</option>
                                            <option value="plate">Plate</option>
                                            <option value="box">Box</option>
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

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Base Price (₹) <span className="text-gray-400 font-normal text-xs">(static fallback)</span></label>
                                    <input 
                                        type="number" 
                                        min="0" step="0.01"
                                        value={formData.base_price || 0}
                                        onChange={e => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white"
                                    />
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

            {/* --- RECIPE MODAL --- */}
            {isRecipeModalOpen && selectedRecipeItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeRecipeModal}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fdf8f4]">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">
                                    Recipe Builder
                                </h2>
                                <p className="text-sm text-amber-700 font-medium">For {selectedRecipeItem.name} (per 1 {selectedRecipeItem.base_unit})</p>
                            </div>
                            <button onClick={closeRecipeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Current Ingredients</h3>
                            
                            {currentRecipe.length === 0 ? (
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center mb-6">
                                    <p className="text-gray-500 font-medium">No ingredients added yet. This item will fallback to static pricing.</p>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Ingredient</th>
                                                <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Qty Needed</th>
                                                <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Wastage</th>
                                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {currentRecipe.map(ing => (
                                                <tr key={ing.ingredient_id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2">
                                                        <div className="text-sm font-bold text-gray-900">{ing.ingredient_name || ing.ingredient_id}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">{ing.quantity_per_base_unit} {ing.unit}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                                                        {ing.wastage_factor}x
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button 
                                                            onClick={() => handleRemoveRecipeIngredient(ing.ingredient_id)}
                                                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                                                            title="Remove from recipe"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3">Add Ingredient</h3>
                            <form id="recipe-form" onSubmit={handleAddRecipeIngredient} className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Inventory Asset</label>
                                    <select 
                                        required
                                        value={recipeFormData.ingredient_id}
                                        onChange={e => setRecipeFormData({...recipeFormData, ingredient_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
                                    >
                                        <option value="" disabled>-- Select an ingredient --</option>
                                        {availableIngredients.map(inv => (
                                            <option key={inv.ingredient_id} value={inv.ingredient_id}>
                                                {inv.ingredient_name} ({inv.unit}) - {inv.available_quantity} available
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Quantity required (per {selectedRecipeItem.base_unit})</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="0" step="0.001"
                                            value={recipeFormData.quantity_per_base_unit || ''}
                                            onChange={e => setRecipeFormData({...recipeFormData, quantity_per_base_unit: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
                                            placeholder="e.g. 0.25"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Wastage Factor</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="1" step="0.01"
                                            value={recipeFormData.wastage_factor || 1.0}
                                            onChange={e => setRecipeFormData({...recipeFormData, wastage_factor: parseFloat(e.target.value) || 1.0})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
                                            placeholder="e.g. 1.05 for 5% waste"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit"
                                        disabled={isRecipeSubmitting || !recipeFormData.ingredient_id}
                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold transition-colors shadow-md disabled:opacity-50 flex items-center"
                                    >
                                        {isRecipeSubmitting ? "Adding..." : "Add to Recipe"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
