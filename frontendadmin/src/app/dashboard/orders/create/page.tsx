"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder, CreateOrderPayload } from "@/services/orders.service";
import { getMenuItems, MenuItem } from "@/services/menu.service";
import { getErrorMessage } from "@/utils/errorHandler";
import Link from "next/link";

export default function CreateOrderPage() {
    const router = useRouter();
    
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [formData, setFormData] = useState<Omit<CreateOrderPayload, "order_items">>({
        event_date: "",
        event_time: "19:00",
        event_type: "Wedding",
        guest_count: 50,
        venue_address: "",
        special_requests: ""
    });

    const [orderItems, setOrderItems] = useState<{menu_item_id: string, quantity: number, name?: string, base_unit?: string}[]>([]);
    const [selectedMenuId, setSelectedMenuId] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState<number | "">("");

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                // Fetch all active menu items by paginating up to the backend limit of 100
                let allItems: MenuItem[] = [];
                let page = 1;
                let hasMore = true;
                
                while (hasMore) {
                    const items = await getMenuItems(page, 100);
                    allItems = [...allItems, ...items];
                    if (items.length < 100) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                }
                
                setMenuItems(allItems.filter(item => item.is_active));
            } catch (err) {
                setError(getErrorMessage(err, "Failed to load menu items for order creation."));
            } finally {
                setIsLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const handleAddItem = () => {
        if (!selectedMenuId || selectedQuantity === "") return;
        
        const menuItem = menuItems.find(i => i.id === selectedMenuId);
        if (!menuItem) return;

        // NEW: Validate against minimum quantity
        const minQty = Number(menuItem.min_quantity) || 0;
        if (Number(selectedQuantity) < minQty) {
            alert(`Cannot add ${menuItem.name}. The minimum order quantity is ${minQty} ${menuItem.base_unit}(s).`);
            return;
        }

        // Check if item already exists
        const existingIndex = orderItems.findIndex(i => i.menu_item_id === selectedMenuId);
        if (existingIndex >= 0) {
            const newItems = [...orderItems];
            newItems[existingIndex].quantity += Number(selectedQuantity);
            setOrderItems(newItems);
        } else {
            setOrderItems([...orderItems, {
                menu_item_id: selectedMenuId,
                quantity: Number(selectedQuantity),
                name: menuItem.name,
                base_unit: menuItem.base_unit
            }]);
        }

        // Reset
        setSelectedMenuId("");
        setSelectedQuantity("");
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...orderItems];
        newItems.splice(index, 1);
        setOrderItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (orderItems.length === 0) {
            setError("You must add at least one item to the order.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const payload: CreateOrderPayload = {
                ...formData,
                order_items: orderItems.map(item => ({
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity
                }))
            };

            await createOrder(payload);
            router.push("/dashboard/orders");
        } catch (err) {
            setError(getErrorMessage(err, "Failed to create order."));
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading catalog...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-4">
                <Link 
                    href="/dashboard/orders"
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Draft New Order</h1>
                    <p className="text-gray-500 text-sm mt-1">Record client requirements and build the event menu.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Event Details */}
                <div className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-max">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Event Details</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Event Date</label>
                            <input 
                                type="date" 
                                required 
                                value={formData.event_date} 
                                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Event Time</label>
                            <input 
                                type="time" 
                                required 
                                value={formData.event_time} 
                                onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900 bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Event Type</label>
                            <select 
                                required 
                                value={formData.event_type} 
                                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900 bg-white"
                            >
                                <option value="Wedding">Wedding</option>
                                <option value="Conference">Conference</option>
                                <option value="Birthday">Birthday</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Family Gathering">Family Gathering</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Guest Count</label>
                            <input 
                                type="number" 
                                required 
                                min="10"
                                value={formData.guest_count} 
                                onChange={(e) => setFormData({...formData, guest_count: parseInt(e.target.value) || 0})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-gray-900 bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Venue Address</label>
                        <textarea 
                            required 
                            minLength={10}
                            value={formData.venue_address} 
                            onChange={(e) => setFormData({...formData, venue_address: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 transition-colors h-24 resize-none text-gray-900 bg-white"
                            placeholder="Complete address for delivery/catering setup..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Special Requests <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                        <textarea 
                            value={formData.special_requests} 
                            onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 transition-colors h-16 resize-none text-gray-900 bg-white"
                            placeholder="Allergies, VIP arrangements..."
                        />
                    </div>
                </div>

                {/* Right Column: Menu Selection */}
                <div className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Menu Composition</h2>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-7">
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Select Dish</label>
                                <select 
                                    value={selectedMenuId} 
                                    onChange={(e) => {
                                        const mid = e.target.value;
                                        setSelectedMenuId(mid);
                                        const item = menuItems.find(i => i.id === mid);
                                        if (item) {
                                            // Default to max of guest count or min_quantity
                                            const min = Number(item.min_quantity) || 1;
                                            const def = Math.max(formData.guest_count || 0, min);
                                            setSelectedQuantity(def);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-sm text-gray-900 bg-white"
                                >
                                    <option value="" disabled>Choose...</option>
                                    {menuItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Qty</label>
                                    {selectedMenuId && (
                                        <span className="text-[10px] font-bold text-[#689F38]">
                                            Min: {menuItems.find(i => i.id === selectedMenuId)?.min_quantity}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number" 
                                    min="0.5" step="0.5"
                                    value={selectedQuantity} 
                                    onChange={(e) => setSelectedQuantity(e.target.value ? parseFloat(e.target.value) : "")}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#689F38]/50 text-sm text-gray-900 bg-white ${
                                        selectedMenuId && Number(selectedQuantity) < Number(menuItems.find(i => i.id === selectedMenuId)?.min_quantity || 0) 
                                        ? 'border-red-300 ring-1 ring-red-100' 
                                        : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            <div className="col-span-2">
                                <button 
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={!selectedMenuId || selectedQuantity === "" || (Boolean(selectedMenuId) && Number(selectedQuantity) < Number(menuItems.find(i => i.id === selectedMenuId)?.min_quantity || 0))}
                                    className="w-full h-[38px] bg-[#689F38] hover:bg-[#558B2F] disabled:bg-gray-300 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {selectedMenuId && Number(selectedQuantity) < Number(menuItems.find(i => i.id === selectedMenuId)?.min_quantity || 0) && (
                            <p className="text-[10px] text-red-500 mt-1 font-bold italic">⚠ Quantity is below the minimum required for this dish.</p>
                        )}
                    </div>

                    <div className="mt-4">
                        {orderItems.length === 0 ? (
                            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500 text-sm">No items added to this order.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                                {orderItems.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="font-mono font-medium text-sm">{item.quantity}</span>
                                                <span className="text-xs text-gray-500 ml-1">{item.base_unit}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-red-400 hover:text-red-600 p-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="pt-6 border-t mt-6">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || orderItems.length === 0}
                            className="w-full py-3 bg-[#689F38] hover:bg-[#558B2F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-colors shadow-lg shadow-[#689F38]/20"
                        >
                            {isSubmitting ? "Generating Draft..." : "Create Draft Order"}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
