"use client";

import { useEffect, useState } from "react";
import { 
    getAllStockLevels, 
    recordTransaction, 
    createIngredient,
    getIngredientById,
    updateIngredient,
    deleteIngredient,
    bulkCreateIngredients,
    StockLevel,
    StockTransactionPayload,
    IngredientPayload
} from "@/services/stock.service";
import { getErrorMessage } from "@/utils/errorHandler";

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
        quantity: "",
        notes: ""
    });

    // Add Ingredient State
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [ingredientFormData, setIngredientFormData] = useState<IngredientPayload>({
        name: "",
        unit: "kg",
        current_price_per_unit: "",
        reorder_level: "",
        is_perishable: false,
        shelf_life_days: ""
    });

    // Edit Ingredient State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
    const [editIngredientFormData, setEditIngredientFormData] = useState<Partial<IngredientPayload>>({
        name: "",
        unit: "kg",
        current_price_per_unit: "",
        reorder_level: "",
        is_perishable: false,
        shelf_life_days: ""
    });

    // Bulk Add Ingredient State
    const [isBulkIngredientModalOpen, setIsBulkIngredientModalOpen] = useState(false);
    const [bulkIngredients, setBulkIngredients] = useState<IngredientPayload[]>([{
        name: "",
        unit: "kg",
        current_price_per_unit: "",
        reorder_level: "",
        is_perishable: false,
        shelf_life_days: ""
    }]);

    const addBulkRow = () => {
        if (bulkIngredients.length >= 100) {
            alert("Maximum 100 ingredients can be added at once.");
            return;
        }
        setBulkIngredients([...bulkIngredients, {
            name: "",
            unit: "kg",
            current_price_per_unit: "",
            reorder_level: "",
            is_perishable: false,
            shelf_life_days: ""
        }]);
    };

    const removeBulkRow = (index: number) => {
        const newItems = [...bulkIngredients];
        newItems.splice(index, 1);
        setBulkIngredients(newItems);
    };

    const handleBulkIngredientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = bulkIngredients.every(item => item.name && item.current_price_per_unit !== "" && item.reorder_level !== "");
        if (!isValid) {
            alert("Please fill in all required numeric fields for every ingredient.");
            return;
        }

        // 1) Check for internal duplicates within the bulk list
        const bulkNames = bulkIngredients.map(item => item.name.trim().toLowerCase());
        if (new Set(bulkNames).size !== bulkNames.length) {
            alert("Duplicate ingredient names found within your bulk list. Please remove duplicates.");
            return;
        }

        // 2) Check against existing ingredients in the database
        const existingNames = new Set(stocks.map(s => s.ingredient_name.toLowerCase()));
        const duplicateNames = bulkIngredients
            .map(item => item.name.trim())
            .filter(name => existingNames.has(name.toLowerCase()));
            
        if (duplicateNames.length > 0) {
            alert(`The following ingredients already exist: ${duplicateNames.join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const payload = bulkIngredients.map(item => {
                const newItem = { ...item };
                if (!newItem.is_perishable || newItem.shelf_life_days === "") {
                    delete newItem.shelf_life_days;
                }
                return newItem;
            });
            await bulkCreateIngredients(payload);
            setIsBulkIngredientModalOpen(false);
            setBulkIngredients([{
                name: "",
                unit: "kg",
                current_price_per_unit: "",
                reorder_level: "",
                is_perishable: false,
                shelf_life_days: ""
            }]);
            await fetchData();
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, "Failed to bulk create ingredients."));
        } finally {
            setIsSubmitting(false);
        }
    };

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
            quantity: "",
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
        
        if (formData.quantity === "" || isNaN(Number(formData.quantity))) {
            alert("Please enter a valid quantity.");
            return;
        }

        // Only require > 0 for purchase, consumption, and wastage. 
        // Adjustment allows 0 to reset stock.
        const qty = Number(formData.quantity);
        if (formData.transaction_type !== 'adjustment' && qty <= 0) {
            alert(`Quantity for ${formData.transaction_type} must be greater than zero.`);
            return;
        }

        if (formData.transaction_type === 'adjustment' && qty < 0) {
            alert("Adjustment quantity cannot be negative.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await recordTransaction({...formData, quantity: qty});
            closeModal();
            // Refresh data to get the newly calculated available/usable stock
            await fetchData();
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, "Failed to process stock transaction."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIngredientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (ingredientFormData.current_price_per_unit === "" || ingredientFormData.reorder_level === "") {
            alert("Please fill in all required numeric fields.");
            return;
        }

        // Duplicate check against existing ingredients
        const isDuplicate = stocks.some(
            s => s.ingredient_name.toLowerCase() === ingredientFormData.name.trim().toLowerCase()
        );
        if (isDuplicate) {
            alert(`An ingredient named "${ingredientFormData.name}" already exists.`);
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const payload = { ...ingredientFormData };
            
            // Remove shelf_life_days if it's an empty string or if not perishable
            if (!payload.is_perishable || payload.shelf_life_days === "") {
                delete payload.shelf_life_days;
            }

            await createIngredient(payload);
            setIsIngredientModalOpen(false);
            setIngredientFormData({
                name: "",
                unit: "kg",
                current_price_per_unit: "",
                reorder_level: "",
                is_perishable: false,
                shelf_life_days: ""
            });
            await fetchData();
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, "Failed to create ingredient."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = async (ingredientId: string) => {
        setIsLoading(true);
        try {
            const ingredientDetails = await getIngredientById(ingredientId);
            setEditIngredientFormData({
                name: ingredientDetails.name,
                unit: ingredientDetails.unit,
                current_price_per_unit: Number(ingredientDetails.current_price_per_unit),
                reorder_level: Number(ingredientDetails.reorder_level),
                is_perishable: ingredientDetails.is_perishable,
                shelf_life_days: ingredientDetails.shelf_life_days || 0
            });
            setEditingIngredientId(ingredientId);
            setIsEditModalOpen(true);
        } catch (err: unknown) {
            console.error("Failed to load ingredient details for editing", err);
            setError("Failed to load ingredient details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingIngredientId) return;

        if (editIngredientFormData.current_price_per_unit === "" || editIngredientFormData.reorder_level === "") {
            alert("Please fill in all required numeric fields.");
            return;
        }

        // Duplicate check against existing ingredients (ignoring the current one being edited)
        if (editIngredientFormData.name) {
            const isDuplicate = stocks.some(
                s => s.ingredient_id !== editingIngredientId && 
                     s.ingredient_name.toLowerCase() === editIngredientFormData.name!.trim().toLowerCase()
            );
            if (isDuplicate) {
                alert(`An ingredient named "${editIngredientFormData.name}" already exists.`);
                return;
            }
        }
        
        setIsSubmitting(true);
        setError("");

        try {
            const payload = { ...editIngredientFormData };
            
            if (!payload.is_perishable || payload.shelf_life_days === "") {
                delete payload.shelf_life_days;
            }

            await updateIngredient(editingIngredientId, payload);
            setIsEditModalOpen(false);
            setEditingIngredientId(null);
            await fetchData();
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, "Failed to update ingredient."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteIngredient = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${name}"?\n\nThis will also remove it from all recipes.`)) return;
        try {
            await deleteIngredient(id);
            setStocks(prev => prev.filter(s => s.ingredient_id !== id));
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to delete ingredient. It may be actively reserved for a confirmed order.");
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
                        onClick={() => setIsBulkIngredientModalOpen(true)}
                        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm flex-shrink-0"
                    >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Bulk Add
                    </button>
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

            {/* Stock Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-500 uppercase truncate" title="Total Ingredients">Total Ingredients</p>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 truncate">{stocks.length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-500 uppercase truncate" title="Out of Stock">Out of Stock</p>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 truncate">{stocks.filter(s => Number(s.usable_quantity) <= 0).length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-500 uppercase truncate" title="Fully Available">Fully Available</p>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 truncate">{stocks.filter(s => Number(s.reserved_quantity) === 0).length}</h3>
                    </div>
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(stock.ingredient_id)}
                                                    className="bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#689F38] border border-gray-200 shadow-sm p-2 rounded-lg transition-colors flex-shrink-0"
                                                    title="Edit Ingredient"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => openTransactionModal(stock)}
                                                    className="bg-white border border-gray-200 text-gray-700 hover:text-[#689F38] hover:border-[#689F38] shadow-sm px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                                >
                                                    Log Transaction
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteIngredient(stock.ingredient_id, stock.ingredient_name)}
                                                    className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border border-red-200 shadow-sm p-2 rounded-lg transition-colors flex-shrink-0"
                                                    title="Delete Ingredient"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
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
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-bold text-gray-700">
                                            Quantity <span className="text-gray-400 font-normal">({selectedStock.unit})</span>
                                        </label>
                                        <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                            New Balance: {
                                                formData.transaction_type === 'adjustment' 
                                                ? (formData.quantity || 0)
                                                : formData.transaction_type === 'purchase'
                                                ? (Number(selectedStock.available_quantity) + (Number(formData.quantity) || 0))
                                                : (Number(selectedStock.available_quantity) - (Number(formData.quantity) || 0))
                                            } {selectedStock.unit}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            required
                                            min="0" step="0.01"
                                            value={formData.quantity}
                                            onChange={e => setFormData({...formData, quantity: e.target.value === "" ? "" : parseFloat(e.target.value)})}
                                            className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-lg font-bold transition-all shadow-inner text-gray-900 placeholder-gray-500 bg-white"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-gray-500 font-medium font-mono">{selectedStock.unit}</span>
                                        </div>
                                    </div>
                                    {formData.transaction_type === 'adjustment' && (
                                        <p className="text-[10px] text-amber-600 mt-1 font-medium italic">
                                            Note: This will override the current stock of {selectedStock.available_quantity} {selectedStock.unit}.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Log Notes <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                                    <textarea 
                                        maxLength={500}
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
                                    <input type="text" required minLength={2} maxLength={255} value={ingredientFormData.name} onChange={e => setIngredientFormData({...ingredientFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. Basmati Rice" />
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
                                        <input type="number" required min="0" step="0.01" value={ingredientFormData.current_price_per_unit} onChange={e => setIngredientFormData({...ingredientFormData, current_price_per_unit: e.target.value === "" ? "" : parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Minimum Reorder Level</label>
                                    <input type="number" required min="0" step="0.01" value={ingredientFormData.reorder_level} onChange={e => setIngredientFormData({...ingredientFormData, reorder_level: e.target.value === "" ? "" : parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" placeholder="Alert when stock falls below..." />
                                </div>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={ingredientFormData.is_perishable} onChange={e => setIngredientFormData({...ingredientFormData, is_perishable: e.target.checked})} className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]" />
                                        <span className="text-sm font-bold text-gray-700">Is this ingredient perishable?</span>
                                    </label>
                                    {ingredientFormData.is_perishable && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Shelf Life (Days)</label>
                                            <input type="number" min="1" required={ingredientFormData.is_perishable} value={ingredientFormData.shelf_life_days} onChange={e => setIngredientFormData({...ingredientFormData, shelf_life_days: e.target.value === "" ? "" : parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. 3" />
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

            {/* --- EDIT INGREDIENT MODAL --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Edit Ingredient</h2>
                                <p className="text-sm text-gray-500 font-medium">Update properties for {editIngredientFormData.name}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="edit-ingredient-form" onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ingredient Name</label>
                                    <input type="text" required minLength={2} maxLength={255} value={editIngredientFormData.name} onChange={e => setEditIngredientFormData({...editIngredientFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] transition-colors text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. Basmati Rice" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit of Measurement</label>
                                        <select required value={editIngredientFormData.unit} onChange={e => setEditIngredientFormData({...editIngredientFormData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white">
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
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Price per {editIngredientFormData.unit || 'Unit'} (₹)</label>
                                        <input type="number" required min="0" step="0.01" value={editIngredientFormData.current_price_per_unit} onChange={e => setEditIngredientFormData({...editIngredientFormData, current_price_per_unit: e.target.value === "" ? "" : parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Minimum Reorder Level</label>
                                    <input type="number" required min="0" step="0.01" value={editIngredientFormData.reorder_level} onChange={e => setEditIngredientFormData({...editIngredientFormData, reorder_level: e.target.value === "" ? "" : parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" placeholder="Alert when stock falls below..." />
                                </div>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editIngredientFormData.is_perishable || false} onChange={e => setEditIngredientFormData({...editIngredientFormData, is_perishable: e.target.checked})} className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]" />
                                        <span className="text-sm font-bold text-gray-700">Is this ingredient perishable?</span>
                                    </label>
                                    {editIngredientFormData.is_perishable && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Shelf Life (Days)</label>
                                            <input type="number" min="1" required={editIngredientFormData.is_perishable} value={editIngredientFormData.shelf_life_days} onChange={e => setEditIngredientFormData({...editIngredientFormData, shelf_life_days: e.target.value === "" ? "" : parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 placeholder-gray-500 bg-white" placeholder="e.g. 3" />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsEditModalOpen(false)} type="button" className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold transition-colors">Cancel</button>
                            <button type="submit" form="edit-ingredient-form" disabled={isSubmitting} className="px-6 py-2 bg-[#689F38] hover:bg-[#558B2F] text-white rounded-lg font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center justify-center min-w-[120px]">
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BULK ADD INGREDIENT MODAL --- */}
            {isBulkIngredientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsBulkIngredientModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Bulk Add Ingredients</h2>
                                <p className="text-sm text-gray-500 font-medium">Add multiple raw materials at once (max 100)</p>
                            </div>
                            <button onClick={() => setIsBulkIngredientModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-50">
                            <form id="bulk-ingredient-form" onSubmit={handleBulkIngredientSubmit} className="space-y-4">
                                {bulkIngredients.map((item, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-500 flex-shrink-0 mt-1">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="lg:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Ingredient Name</label>
                                                    <input type="text" required minLength={2} maxLength={255} value={item.name} onChange={e => {
                                                        const newItems = [...bulkIngredients];
                                                        newItems[index].name = e.target.value;
                                                        setBulkIngredients(newItems);
                                                    }} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Basmati Rice" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                                                    <select required value={item.unit} onChange={e => {
                                                        const newItems = [...bulkIngredients];
                                                        newItems[index].unit = e.target.value;
                                                        setBulkIngredients(newItems);
                                                    }} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                                                        <option value="kg">kg</option>
                                                        <option value="gram">g</option>
                                                        <option value="liter">L</option>
                                                        <option value="ml">ml</option>
                                                        <option value="piece">Piece</option>
                                                        <option value="dozen">Dozen</option>
                                                        <option value="tsp">tsp</option>
                                                        <option value="tbsp">tbsp</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                                                    <input type="number" required min="0" step="0.01" value={item.current_price_per_unit} onChange={e => {
                                                        const newItems = [...bulkIngredients];
                                                        newItems[index].current_price_per_unit = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                        setBulkIngredients(newItems);
                                                    }} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Reorder Level</label>
                                                    <input type="number" required min="0" step="0.01" value={item.reorder_level} onChange={e => {
                                                        const newItems = [...bulkIngredients];
                                                        newItems[index].reorder_level = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                        setBulkIngredients(newItems);
                                                    }} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                                </div>
                                                <div className="flex items-center gap-2 pt-5">
                                                    <input type="checkbox" checked={item.is_perishable} onChange={e => {
                                                        const newItems = [...bulkIngredients];
                                                        newItems[index].is_perishable = e.target.checked;
                                                        setBulkIngredients(newItems);
                                                    }} className="w-4 h-4 text-[#689F38] rounded border-gray-300 focus:ring-[#689F38]" />
                                                    <span className="text-xs font-bold text-gray-700">Perishable?</span>
                                                </div>
                                                {item.is_perishable && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Shelf Life (Days)</label>
                                                        <input type="number" min="1" required={item.is_perishable} value={item.shelf_life_days} onChange={e => {
                                                            const newItems = [...bulkIngredients];
                                                            newItems[index].shelf_life_days = e.target.value === "" ? "" : parseInt(e.target.value);
                                                            setBulkIngredients(newItems);
                                                        }} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {bulkIngredients.length > 1 && (
                                            <button type="button" onClick={() => removeBulkRow(index)} className="mt-1 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0" title="Remove row">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                <div className="pt-2">
                                    <button type="button" onClick={addBulkRow} className="text-[#689F38] font-bold text-sm hover:underline flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Another Row
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsBulkIngredientModalOpen(false)} type="button" className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold transition-colors">Cancel</button>
                            <button type="submit" form="bulk-ingredient-form" disabled={isSubmitting} className="px-6 py-2 bg-[#689F38] hover:bg-[#558B2F] text-white rounded-lg font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center justify-center min-w-[120px]">
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : `Save ${bulkIngredients.length} Ingredients`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
