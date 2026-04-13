"use client";

import { useEffect, useState } from "react";
import { getMenuItems, MenuItem } from "@/services/menu.service";
import theme from "@/utils/theme";

export default function MenuListingPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const data = await getMenuItems();
                setItems(data || []);
            } catch (err: any) {
                console.error("Failed to load menu UI:", err);
                setError("Failed to fetch menu items from the database.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenu();
    }, []);

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading recipe catalogues...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                    <svg className="w-6 h-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-red-800 font-bold text-lg">Menu Synchronization Error</h3>
                </div>
                <p className="text-red-700 mt-2 ml-9">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 ml-9 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium transition-colors"
                >
                    Retry Connection
                </button>
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
                    <button className="bg-[#689F38] hover:bg-[#558B2F] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </button>
                </div>
            </div>

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
                                            <button className="text-[#689F38] hover:text-[#558B2F] bg-transparent hover:bg-[#689F38]/10 px-2 py-1 rounded transition-colors mr-2">
                                                Edit
                                            </button>
                                            <button className="text-red-500 hover:text-red-700 bg-transparent hover:bg-red-50 px-2 py-1 rounded transition-colors">
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

        </div>
    );
}
