"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary, getProcurementAlerts, DashboardSummary, ProcurementAlert } from "@/services/dashboard.service";
import theme from "@/utils/theme";

export default function DashboardOverviewPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [alerts, setAlerts] = useState<ProcurementAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Only apply date filters if BOTH dates are selected
                const validFrom = (fromDate && toDate) ? fromDate : undefined;
                const validTo = (fromDate && toDate) ? toDate : undefined;

                // Run queries concurrently
                const [summaryData, alertsData] = await Promise.all([
                    getDashboardSummary(validFrom, validTo),
                    getProcurementAlerts(),
                ]);
                
                setSummary(summaryData);
                setAlerts(alertsData || []);
            } catch (err: any) {
                console.error("Failed to load dashboard data:", err);
                setError("Failed to synchronize dashboard with secure servers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [fromDate, toDate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Aggregating live insights...</p>
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
                    <h3 className="text-red-800 font-bold text-lg">Data Synchronization Error</h3>
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">High-level insights into financial velocity and procurement needs.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">From Date</label>
                            <input 
                                type="date" 
                                value={fromDate} 
                                onChange={(e) => setFromDate(e.target.value)}
                                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer"
                            />
                        </div>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">To Date</label>
                            <input 
                                type="date" 
                                value={toDate} 
                                onChange={(e) => setToDate(e.target.value)}
                                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer"
                            />
                        </div>
                        {(fromDate || toDate) && (
                            <button 
                                onClick={() => { setFromDate(""); setToDate(""); }}
                                className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Clear Dates"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Revenue Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-emerald-500/10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Pipeline Value</p>
                            <h3 className="text-3xl font-extrabold text-gray-900">
                                ₹{(summary?.totalRevenue || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center p-3 shadow-inner">
                            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Advance Collected Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-purple-500/10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Advance Collected</p>
                            <h3 className="text-3xl font-extrabold text-gray-900">
                                ₹{(summary?.advanceCollected || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center p-3 shadow-inner">
                            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Orders Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                            <h3 className="text-3xl font-extrabold text-gray-900">
                                {summary?.totalOrders || 0}
                            </h3>
                            <p className="text-xs text-blue-600 mt-2 font-medium">{summary?.activeOrders || 0} currently active</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center p-3 shadow-inner">
                            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

            </div>

            {/* Procurement Alerts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Critical Stock Alerts
                            {alerts.length > 0 && (
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold ml-2">
                                    {alerts.length} Items Low
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Ingredients falling below minimum reorder thresholds</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {alerts.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50/50">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Inventory is Healthy!</h3>
                            <p className="text-gray-500">No procurement alerts detected. All stock levels are sufficient.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/70">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingredient</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reorder Target</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deficit</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {alerts.map((alert, index) => {
                                    // Calculate progress percentage for visual bar (0 -> 100% of reorder level)
                                    const available = parseFloat(alert.available_quantity as string) || 0;
                                    const reorder = parseFloat(alert.reorder_level as string) || 1;
                                    const percentage = Math.max(0, Math.min(100, (available / reorder) * 100));
                                    
                                    // Red if completely empty or near empty (<25%), otherwise yellow/orange
                                    const progressColor = percentage < 25 ? 'bg-red-500' : 'bg-orange-400';

                                    return (
                                        <tr key={alert.ingredient_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold mr-3">
                                                        {typeof alert.name === 'string' && alert.name.length > 0 ? alert.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">{alert.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1 w-32">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {alert.available_quantity} {alert.unit}
                                                    </span>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-1.5 rounded-full ${progressColor}`} style={{ width: percentage + '%' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">{alert.reorder_level} {alert.unit}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                                    -{alert.deficit} {alert.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                                    Urgent Restock
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
