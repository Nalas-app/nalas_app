"use client";

import { useEffect, useState } from "react";
import { 
    getAllStockLevels, 
    recordTransaction, 
    createIngredient,
    StockLevel,
    StockTransactionPayload,
    IngredientPayload
} from "@/services/stock.service";

export default function StockManagementPage() {
    const [stocks, setStocks] = useState<StockLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<StockLevel | null>(null);

    // Form State
    const [formData, setFormData] = useState<StockTransactionPayload>({
        ingredient_id: "",
        transaction_type: "purchase",
        quantity: 0,
        notes: ""
    });

    // Add Ingredient State
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [ingredientFormData, setIngredientFormData] = useState<IngredientPayload>({
        name: "",
        unit: "kg",
        current_price_per_unit: 0,
        reorder_level: 0,
        is_perishable: false,
        shelf_life_days: 0
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const fetchedStocks = await getAllStockLevels();
            setStocks(fetchedStocks || []);
        } catch (err: any) {
            console.error("Failed to load stock levels:", err);
            setError("Failed to synchronize inventory from the database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredStocks = stocks.filter(stock => 
        stock.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openTransactionModal = (stock: StockLevel) => {
        setSelectedStock(stock);
        setFormData({
            ingredient_id: stock.ingredient_id,
            transaction_type: "purchase",
            quantity: 0,
            notes: ""
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStock(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.quantity <= 0) {
            alert("Quantity must be greater than zero.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await recordTransaction(formData);
            closeModal();
            // Refresh data to get the newly calculated available/usable stock
            await fetchData();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to process stock transaction.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIngredientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await createIngredient(ingredientFormData);
            setIsIngredientModalOpen(false);
            setIngredientFormData({
                name: "",
                unit: "kg",
                current_price_per_unit: 0,
                reorder_level: 0,
                is_perishable: false,
                shelf_life_days: 0
            });
            await fetchData();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create ingredient.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && stocks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Scanning inventory silos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Inventory & Stock Pipeline</h1>
                    <p className="text-gray-500 text-sm mt-1">Audit active reserves and initiate stock adjustments</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Find ingredient..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38] focus:border-transparent transition-shadow w-full md:w-64 text-gray-900 placeholder-gray-500 bg-white"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button 
                        onClick={() => setIsIngredientModalOpen(true)}
                        className="bg-[#689F38] hover:bg-[#558B2F] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md flex-shrink-0"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Ingredient
                    </button>
                </div>
            </div>

            {error && !isModalOpen && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchData} className="underline hover:text-red-800">Retry Fast-Sync</button>
                </div>
            )}

            {/* Data Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredStocks.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50/50">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Inventory Found</h3>
                            <p className="text-gray-500">
                                {searchQuery ? "No ingredients matched your search criteria." : "Inventory is empty. You must create ingredients first."}
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/70">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ingredient Asset</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Availability</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Locked/Reserved</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-[#689F38] uppercase tracking-wider">Net Usable Stock</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Controls</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredStocks.map((stock) => (
                                    <tr key={stock.ingredient_id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center border border-orange-200 flex-shrink-0">
                                                    <span className="text-orange-700 font-bold text-lg">
                                                        {stock.ingredient_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{stock.ingredient_name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">ID: {stock.ingredient_id.split('-')[0]}</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded w-full inline-block">
                                                {stock.available_quantity} <span className="text-gray-500 text-xs ml-1">{stock.unit}</span>
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded w-full inline-block">
                                                {stock.reserved_quantity} <span className="text-amber-600/70 text-xs ml-1">{stock.unit}</span>
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-extrabold text-[#558B2F] bg-[#689F38]/10 border border-[#689F38]/20 px-3 py-1 rounded w-full inline-block shadow-sm">
                                                {stock.usable_quantity} <span className="text-[#689F38]/70 text-xs ml-1">{stock.unit}</span>
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button 
                                                onClick={() => openTransactionModal(stock)}
                                                className="bg-white border border-gray-200 text-gray-700 hover:text-[#689F38] hover:border-[#689F38] shadow-sm px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                            >
                                                Log Transaction
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- TRANSACTION MODAL --- */}
            {isModalOpen && selectedStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col transform transition-all">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">
                                    Stock Adjustment
                                </h2>
                                <p className="text-sm text-[#689F38] font-medium">{selectedStock.ingredient_name}</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <form id="transaction-form" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Action Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['purchase', 'adjustment', 'consumption', 'wastage'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({...formData, transaction_type: type})}
                                                className={`py-2 px-3 text-sm font-bold rounded-lg border transition-colors ${
                                                    formData.transaction_type === type 
                                                        ? (type === 'purchase' || type === 'adjustment' ? 'bg-[#689F38]/10 border-[#689F38] text-[#558B2F]' : 'bg-red-50 border-red-300 text-red-700')
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                        Quantity <span className="text-gray-400 font-normal">({selectedStock.unit})</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            required
                                            min="0" step="0.01"
                                            value={formData.quantity || ''}
                                            onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                                            className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-lg font-bold transition-all shadow-inner text-gray-900 placeholder-gray-500 bg-white"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-gray-500 font-medium font-mono">{selectedStock.unit}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Log Notes <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                                    <textarea 
                                        value={formData.notes || ""}
                                        onChange={e => setFormData({...formData, notes: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors h-20 resize-none text-sm text-gray-900 placeholder-gray-500 bg-white"
                                        placeholder="Reason for adjustment, vendor details, etc."
                                    />
                                </div>
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button 
                                onClick={closeModal}
                                type="button"
                                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                form="transaction-form"
                                disabled={isSubmitting}
                                className={`px-6 py-2 text-white rounded-lg font-bold transition-colors shadow-md flex items-center justify-center min-w-[120px] ${
                                    formData.transaction_type === "consumption" || formData.transaction_type === "wastage"
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                                    : "bg-[#689F38] hover:bg-[#558B2F] shadow-[#689F38]/20"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD INGREDIENT MODAL --- */}
            {isIngredientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsIngredientModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Add New Ingredient</h2>
                                <p className="text-sm text-gray-500 font-medium">Create a new raw material for your inventory</p>
                            </div>
                            <button onClick={() => setIsIngredientModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="ingredient-form" onSubmit={handleIngredientSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ingredient Name</label>
                                    <input type="text" required value={ingredientFormData.name} onChange={e => setIngredientFormData({...ingredientFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. Basmati Rice" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit of Measurement</label>
                                        <select required value={ingredientFormData.unit} onChange={e => setIngredientFormData({...ingredientFormData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white">
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="gram">Gram (g)</option>
                                            <option value="liter">Liter (L)</option>
                                            <option value="ml">Milliliter (ml)</option>
                                            <option value="piece">Piece</option>
                                            <option value="dozen">Dozen</option>
                                            <option value="tsp">Teaspoon (tsp)</option>
                                            <option value="tbsp">Tablespoon (tbsp)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Price per {ingredientFormData.unit || 'Unit'} (₹)</label>
                                        <input type="number" required min="0" step="0.01" value={ingredientFormData.current_price_per_unit || ''} onChange={e => setIngredientFormData({...ingredientFormData, current_price_per_unit: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Minimum Reorder Level</label>
                                    <input type="number" required min="0" step="0.01" value={ingredientFormData.reorder_level || ''} onChange={e => setIngredientFormData({...ingredientFormData, reorder_level: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" placeholder="Alert when stock falls below..." />
                                </div>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={ingredientFormData.is_perishable} onChange={e => setIngredientFormData({...ingredientFormData, is_perishable: e.target.checked})} className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]" />
                                        <span className="text-sm font-bold text-gray-700">Is this ingredient perishable?</span>
                                    </label>
                                    {ingredientFormData.is_perishable && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Shelf Life (Days)</label>
                                            <input type="number" min="1" required={ingredientFormData.is_perishable} value={ingredientFormData.shelf_life_days || ''} onChange={e => setIngredientFormData({...ingredientFormData, shelf_life_days: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. 3" />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsIngredientModalOpen(false)} type="button" className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold transition-colors">Cancel</button>
                            <button type="submit" form="ingredient-form" disabled={isSubmitting} className="px-6 py-2 bg-[#689F38] hover:bg-[#558B2F] text-white rounded-lg font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center justify-center min-w-[120px]">
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
