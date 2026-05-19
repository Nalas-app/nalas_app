"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMenuItemById, getRecipe, addRecipeIngredient, removeRecipeIngredient, MenuItem, RecipeIngredient } from "@/services/menu.service";
import { getAllStockLevels, StockLevel } from "@/services/stock.service";
import { getErrorMessage } from "@/utils/errorHandler";
import Link from "next/link";

export default function RecipeBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const menuId = params.id as string;

    const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
    const [recipe, setRecipe] = useState<RecipeIngredient[]>([]);
    const [availableIngredients, setAvailableIngredients] = useState<StockLevel[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [selectedIngredient, setSelectedIngredient] = useState<string>("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [wastageFactor, setWastageFactor] = useState<number | "">(1.05);

    const fetchData = async () => {
        setIsLoading(true);
        setError("");
        try {
            const [itemData, recipeData, stockData] = await Promise.all([
                getMenuItemById(menuId),
                getRecipe(menuId).catch(() => []), // If 404, it might mean no recipe yet
                getAllStockLevels()
            ]);
            setMenuItem(itemData);
            setRecipe(recipeData || []);
            setAvailableIngredients(stockData || []);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to load recipe data."));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (menuId) {
            fetchData();
        }
    }, [menuId]);

    const handleAddIngredient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIngredient || quantity === "") return;

        setIsSubmitting(true);
        try {
            await addRecipeIngredient(menuId, {
                ingredient_id: selectedIngredient,
                quantity_per_base_unit: Number(quantity),
                wastage_factor: Number(wastageFactor) || 1.05
            });
            
            // Reset form
            setSelectedIngredient("");
            setQuantity("");
            setWastageFactor(1.05);
            
            // Refresh recipe list
            const updatedRecipe = await getRecipe(menuId);
            setRecipe(updatedRecipe);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to add ingredient to recipe."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveIngredient = async (ingredientId: string) => {
        if (!confirm("Are you sure you want to remove this ingredient from the recipe?")) return;
        
        setIsSubmitting(true);
        try {
            await removeRecipeIngredient(menuId, ingredientId);
            const updatedRecipe = await getRecipe(menuId);
            setRecipe(updatedRecipe);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to remove ingredient."));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading recipe details...</p>
            </div>
        );
    }

    if (!menuItem) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Menu item not found</h2>
                <Link href="/dashboard/menu" className="text-[#689F38] hover:underline mt-4 inline-block">Return to Menu</Link>
            </div>
        );
    }

    // Filter out ingredients already in the recipe
    const availableToAdd = availableIngredients.filter(
        stock => !recipe.some(ri => ri.ingredient_id === stock.ingredient_id)
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            Recipe Builder
                            <span className="text-sm font-medium bg-[#689F38]/10 text-[#558B2F] px-2 py-1 rounded">
                                {menuItem.name}
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Define ingredients required for {menuItem.base_unit}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
                        <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Add Ingredient</h3>
                        <form onSubmit={handleAddIngredient} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ingredient</label>
                                <select 
                                    required 
                                    value={selectedIngredient} 
                                    onChange={(e) => setSelectedIngredient(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900 bg-white"
                                >
                                    <option value="" disabled>Select an ingredient...</option>
                                    {availableToAdd.map(ing => (
                                        <option key={ing.ingredient_id} value={ing.ingredient_id}>
                                            {ing.ingredient_name} ({ing.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Quantity Required
                                    <span className="text-gray-400 font-normal ml-1">
                                        (per 1 {menuItem.base_unit})
                                    </span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        required 
                                        min="0.001" step="0.001"
                                        value={quantity} 
                                        onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900"
                                        placeholder="e.g. 0.25"
                                    />
                                    {selectedIngredient && (
                                        <div className="absolute right-3 top-2.5 text-gray-400 text-sm font-mono">
                                            {availableIngredients.find(i => i.ingredient_id === selectedIngredient)?.unit}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Wastage Factor
                                </label>
                                <input 
                                    type="number" 
                                    required 
                                    min="1" step="0.01"
                                    value={wastageFactor} 
                                    onChange={(e) => setWastageFactor(e.target.value ? parseFloat(e.target.value) : "")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900"
                                    placeholder="1.05 (means 5% waste)"
                                />
                                <p className="text-xs text-gray-500 mt-1">Multiplier to account for prep loss (1.0 = no loss).</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting || !selectedIngredient}
                                className="w-full py-2.5 bg-[#689F38] hover:bg-[#558B2F] disabled:bg-gray-300 text-white rounded-lg font-bold transition-colors shadow-sm"
                            >
                                {isSubmitting ? "Adding..." : "Add to Recipe"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Recipe List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Current Recipe Ingredients</h3>
                            <span className="text-sm text-gray-500 font-medium">{recipe.length} ingredients</span>
                        </div>
                        
                        {recipe.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="text-gray-500">No ingredients added yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Use the form on the left to build the recipe.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ingredient</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Quantity (Net)</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Waste Factor</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Gross Cost</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recipe.map((ing) => (
                                        <tr key={ing.ingredient_id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-gray-900">{ing.ingredient_name || 'Unknown'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="font-mono text-sm text-gray-700">{ing.quantity_per_base_unit}</span>
                                                <span className="text-xs text-gray-500 ml-1">{ing.unit || 'unit'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm text-gray-600">x{ing.wastage_factor}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-medium text-emerald-600">
                                                    ₹{Number((ing as any).total_cost_with_wastage || ing.cost_contribution || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button 
                                                    onClick={() => handleRemoveIngredient(ing.ingredient_id)}
                                                    disabled={isSubmitting}
                                                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                    title="Remove ingredient"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right font-bold text-gray-700">Estimated Base Cost:</td>
                                        <td className="px-6 py-3 text-right font-extrabold text-[#689F38]">
                                            ₹{recipe.reduce((sum, item) => sum + Number((item as any).total_cost_with_wastage || item.cost_contribution || 0), 0).toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
