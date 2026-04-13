"use client";

import { useEffect, useState } from "react";
import { 
    getOrders, 
    updateOrderStatus, 
    generateQuotation, 
    confirmOrder,
    Order
} from "@/services/orders.service";

export default function OrdersManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<string>("all"); // 'all', 'active', 'completed'

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const fetchedOrders = await getOrders();
            setOrders(fetchedOrders || []);
        } catch (err: any) {
            console.error("Failed to load orders:", err);
            setError("Failed to fetch order pipeline from the database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return !['completed', 'cancelled', 'draft'].includes(order.status);
        if (activeTab === 'completed') return order.status === 'completed';
        if (activeTab === 'drafts') return order.status === 'draft';
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'quoted': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'confirmed': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'preparing': return 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleAction = async (orderId: string, actionType: 'quote' | 'confirm' | 'complete') => {
        try {
            if (actionType === 'quote') {
                await generateQuotation(orderId);
                alert("Quotation generated successfully!");
            } else if (actionType === 'confirm') {
                await confirmOrder(orderId);
                alert("Order legally confirmed and stock reserved!");
            } else if (actionType === 'complete') {
                await updateOrderStatus(orderId, 'completed');
            }
            // Refresh to see new states
            await fetchOrders();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || `Failed to process ${actionType} action.`);
        }
    };

    if (isLoading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Synchronizing Active Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Event & Order Pipeline</h1>
                    <p className="text-gray-500 text-sm mt-1">Track financial velocity, upcoming events, and fulfillment status in real-time.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchOrders} className="underline hover:text-red-800">Retry Fast-Sync</button>
                </div>
            )}

            {/* Sub-Navigation Tabs */}
            <div className="flex px-1 bg-white border border-gray-200 rounded-lg p-1 w-max shadow-sm">
                {[
                    { id: 'all', label: 'All Operations' },
                    { id: 'active', label: 'Active (Quoted/Confirmed/Preparing)' },
                    { id: 'drafts', label: 'Draft Inquiries' },
                    { id: 'completed', label: 'Completed' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                            activeTab === tab.id 
                            ? 'bg-[#fdf0e8] text-[#9b7060] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Data Pipeline Render */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredOrders.length === 0 ? (
                        <div className="p-16 text-center bg-gray-50/50">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 shadow-inner text-gray-400">
                                <svg className="w-8 h-8 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">No File Traces Found</h3>
                            <p className="text-gray-500 font-medium">
                                There are no active records in this division of the pipeline.
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#f0f5f0]/80">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Event Tracing</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Target Date</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Financials</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">System State</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-[#689F38] uppercase tracking-wider">Workflow Step</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/70 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-start">
                                                <div className="h-10 w-10 rounded bg-[#689F38]/10 flex items-center justify-center border border-[#689F38]/20 flex-shrink-0 mt-1">
                                                    <span className="text-[#558B2F] font-bold text-sm uppercase">
                                                        {order.event_type ? order.event_type.slice(0,3) : 'EVT'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <h4 className="text-sm font-extrabold text-gray-900 capitalize">{order.event_type || 'Unknown Event'}</h4>
                                                    <div className="text-xs font-medium text-gray-500 mb-1">Capacity: <span className="text-gray-800">{order.guest_count} guests</span></div>
                                                    <div className="text-[10px] text-gray-400 font-mono tracking-tighter truncate w-32 border-t border-gray-100 pt-1">
                                                        CID: {order.customer_id ? order.customer_id.split('-')[0] : 'GUEST'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-bold text-gray-800">{new Date(order.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                                <span className="text-xs font-bold text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded">{order.event_time}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className="text-sm font-extrabold text-[#689F38]">
                                                ₹ {Number(order.total_amount || 0).toLocaleString()}
                                            </div>
                                            {Number(order.advance_paid) > 0 && (
                                                <div className="text-[11px] font-bold text-green-600 mt-1">
                                                    Paid: ₹ {Number(order.advance_paid).toLocaleString()}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <span className={`inline-flex uppercase items-center px-3 py-1 rounded-full text-xs font-black border tracking-wider shadow-sm ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            {/* Dynamic Action Buttons depending on status */}
                                            {order.status === 'draft' && (
                                                <button 
                                                    onClick={() => handleAction(order.id, 'quote')}
                                                    className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm"
                                                >
                                                    MINT QUOTATION
                                                </button>
                                            )}
                                            {order.status === 'quoted' && (
                                                <button 
                                                    onClick={() => handleAction(order.id, 'confirm')}
                                                    className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm"
                                                >
                                                    FINALIZE & LOCK
                                                </button>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'preparing').then(() => fetchOrders())}
                                                    className="bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white border border-orange-200 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm"
                                                >
                                                    COMMENCE PREP
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button 
                                                    onClick={() => handleAction(order.id, 'complete')}
                                                    className="bg-[#689F38]/10 text-[#558B2F] hover:bg-[#689F38] hover:text-white border border-[#689F38]/30 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm"
                                                >
                                                    MARK FULFILLED
                                                </button>
                                            )}
                                            {['completed', 'cancelled'].includes(order.status) && (
                                                <span className="text-xs font-bold text-gray-400 italic">No Actions Expected</span>
                                            )}
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
