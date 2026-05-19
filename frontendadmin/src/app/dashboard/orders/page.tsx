"use client";

import { useEffect, useState } from "react";
import { 
    getOrders, 
    updateOrderStatus, 
    generateQuotation, 
    confirmOrder,
    Order
} from "@/services/orders.service";
import { recordPayment, getInvoices } from "@/services/billing.service";

export default function OrdersManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<string>("all"); // 'all', 'active', 'completed'
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [transactionId, setTransactionId] = useState("");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const filters: any = {};
            // Only apply filters if BOTH dates are selected
            if (fromDate && toDate) {
                filters.from_date = fromDate;
                filters.to_date = toDate;
            }
            
            const fetchedOrders = await getOrders(1, 50, filters);
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
    }, [fromDate, toDate]);

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

    const openPaymentModal = (order: Order) => {
        setSelectedOrderForPayment(order);
        setPaymentAmount(Math.max(0, Number(order.total_amount || 0) - Number(order.advance_paid || 0)));
        setPaymentMethod("bank_transfer");
        setTransactionId("");
        setIsPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedOrderForPayment(null);
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderForPayment) return;
        
        setIsSubmittingPayment(true);
        try {
            let invoiceId = "";
            
            // If the order is quoted, we must confirm it first to generate the invoice
            if (selectedOrderForPayment.status === 'quoted') {
                const confirmResponse = await confirmOrder(selectedOrderForPayment.id);
                if (confirmResponse?.invoice?.id) {
                    invoiceId = confirmResponse.invoice.id;
                } else {
                    throw new Error("Failed to generate invoice during confirmation.");
                }
            } else {
                // If the order is already confirmed/preparing, fetch its invoice
                const invoices = await getInvoices(1, 10, { order_id: selectedOrderForPayment.id });
                if (invoices && invoices.length > 0) {
                    invoiceId = invoices[0].id;
                } else {
                    throw new Error("No invoice found for this confirmed order.");
                }
            }
            
            // Record the payment
            if (paymentAmount > 0) {
                await recordPayment(
                    invoiceId,
                    paymentAmount,
                    paymentMethod,
                    transactionId || "", // Passed to transaction_id in backend which gets saved
                    selectedOrderForPayment.status === 'quoted' ? "Advance" : "Payment" // Passed to notes (ignored by DB, but kept for schema validation)
                );
                alert("Payment successfully logged and synced with Billing!");
            } else if (selectedOrderForPayment.status === 'quoted') {
                alert("Order confirmed successfully without payment.");
            }
            
            closePaymentModal();
            await fetchOrders();
        } catch (err: any) {
            console.warn(err);
            const errorMsg = err.response?.data?.message || err.message || "Server Error";
            if (errorMsg.toLowerCase().includes('stock')) {
                 alert("⚠️ Insufficient Stock!\n\nYou do not have enough stock available to fulfill this order's recipe. Please go to the Stock Management module, log a purchase for the required ingredients, and then try again.");
            } else {
                 alert("Failed to process payment flow: " + errorMsg);
            }
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleAction = async (orderId: string, actionType: 'quote' | 'confirm' | 'complete') => {
        try {
            if (actionType === 'quote') {
                await generateQuotation(orderId);
                alert("Quotation generated successfully!");
            } else if (actionType === 'confirm') {
                if (!confirm("Confirming this order will permanently reserve stock inventory and generate an official invoice. Proceed?")) return;
                await confirmOrder(orderId);
                alert("Order legally confirmed and stock reserved!");
            } else if (actionType === 'complete') {
                await updateOrderStatus(orderId, 'completed');
            }
            // Refresh to see new states
            await fetchOrders();
        } catch (err: any) {
            console.warn(err);
            const errorMsg = err.response?.data?.message || err.message;
            if (errorMsg?.toLowerCase().includes('stock')) {
                 alert("⚠️ Insufficient Stock!\n\nYou do not have enough stock available to fulfill this order's recipe. Please go to the Stock Management module, log a purchase for the required ingredients, and then try confirming again.");
            } else {
                 alert(errorMsg || `Failed to process ${actionType} action.`);
            }
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
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Event & Order Pipeline</h1>
                    <p className="text-gray-500 text-sm mt-1">Track financial velocity, upcoming events, and fulfillment status in real-time.</p>
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
                    <a 
                        href="/dashboard/orders/create"
                        className="bg-[#689F38] hover:bg-[#558B2F] text-white px-4 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Order
                    </a>
                </div>
            </div>

            {/* Order Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Total Orders</p>
                        <h3 className="text-2xl font-black text-gray-900">{filteredOrders.length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Pipeline Value</p>
                        <h3 className="text-2xl font-black text-gray-900">₹ {filteredOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0).toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase">Advance Collected</p>
                        <h3 className="text-2xl font-black text-gray-900">₹ {filteredOrders.reduce((sum, order) => sum + Number(order.advance_paid || 0), 0).toLocaleString()}</h3>
                    </div>
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
                                            {order.status === 'draft' ? (
                                                <div className="text-sm font-bold text-gray-400 italic">
                                                    TBD (Mint Quote)
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-sm font-extrabold text-[#689F38]" title="Total Value">
                                                        Total: ₹ {Number(order.total_amount || 0).toLocaleString()}
                                                    </div>
                                                    <div className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100" title="Advance/Paid Amount">
                                                        Paid: ₹ {Number(order.advance_paid || 0).toLocaleString()}
                                                    </div>
                                                    {Number(order.total_amount || 0) > Number(order.advance_paid || 0) && (
                                                        <div className="text-[11px] font-bold text-red-500" title="Amount left to pay">
                                                            Pending: ₹ {(Number(order.total_amount || 0) - Number(order.advance_paid || 0)).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <span className={`inline-flex uppercase items-center px-3 py-1 rounded-full text-xs font-black border tracking-wider shadow-sm ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <a 
                                                    href={`/dashboard/orders/${order.id}`}
                                                    className="bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 shadow-sm px-3 py-1.5 rounded-lg font-bold text-xs transition-all inline-block w-full text-center"
                                                >
                                                    View Details
                                                </a>
                                                
                                                {/* Only show Log Payment if the order is confirmed/beyond and there is a pending balance */}
                                                {!['draft', 'quoted', 'cancelled'].includes(order.status) && (Number(order.total_amount || 0) > Number(order.advance_paid || 0)) && (
                                                    <button 
                                                        onClick={() => openPaymentModal(order)}
                                                        className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm w-full text-center"
                                                        title="Log Payment in Billing Dashboard"
                                                    >
                                                        LOG PAYMENT
                                                    </button>
                                                )}

                                                {order.status === 'quoted' && (
                                                    <div className="flex gap-2 w-full">
                                                        <button 
                                                            onClick={() => openPaymentModal(order)}
                                                            className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm w-full text-center"
                                                        >
                                                            LOG PAYMENT
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(order.id, 'confirm')}
                                                            className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm w-full"
                                                            title="Confirm without payment"
                                                        >
                                                            CONFIRM
                                                        </button>
                                                    </div>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'preparing').then(() => fetchOrders())}
                                                        className="bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white border border-orange-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm w-full"
                                                    >
                                                        COMMENCE PREP
                                                    </button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button 
                                                        onClick={() => handleAction(order.id, 'complete')}
                                                        className="bg-[#689F38]/10 text-[#558B2F] hover:bg-[#689F38] hover:text-white border border-[#689F38]/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm w-full"
                                                    >
                                                        MARK FULFILLED
                                                    </button>
                                                )}
                                                {['completed', 'cancelled'].includes(order.status) && (Number(order.total_amount || 0) <= Number(order.advance_paid || 0)) && (
                                                    <span className="text-xs font-bold text-gray-400 italic">Fully Settled</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedOrderForPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closePaymentModal}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-900">Log Payment</h2>
                                <p className="text-sm text-blue-700 font-medium">For Order #{selectedOrderForPayment.id.split('-')[0]}</p>
                            </div>
                            <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedOrderForPayment.status === 'quoted' && (
                                <div className="mb-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200 flex gap-2 items-start">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span><span className="font-bold">Note:</span> Logging a payment will automatically confirm this quotation, reserve stock, and generate an official invoice.</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-4 border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Total Order Value</p>
                                    <p className="text-lg font-black text-gray-900">₹{Number(selectedOrderForPayment.total_amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Already Paid</p>
                                    <p className="text-lg font-black text-green-600">₹{Number(selectedOrderForPayment.advance_paid || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleSubmitPayment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount Paid Now (₹)</label>
                                    <input 
                                        type="number" 
                                        required min="0.01" step="0.01" max={Number(selectedOrderForPayment.total_amount || 0) - Number(selectedOrderForPayment.advance_paid || 0)}
                                        value={paymentAmount || ''}
                                        onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none font-bold text-lg"
                                        placeholder="Enter amount..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Pending balance: ₹{(Number(selectedOrderForPayment.total_amount || 0) - Number(selectedOrderForPayment.advance_paid || 0)).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="bank_transfer">Bank Transfer (UPI/NEFT)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Transaction ID (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={transactionId}
                                        onChange={e => setTransactionId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="E.g., UPI Ref, Bank UTR..."
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={closePaymentModal} className="px-4 py-2 border border-gray-300 font-bold rounded-lg hover:bg-gray-50">Cancel</button>
                                    <button type="submit" disabled={isSubmittingPayment} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">
                                        {isSubmittingPayment ? "Processing..." : (selectedOrderForPayment.status === 'quoted' ? "Log Payment & Confirm" : "Log Payment")}
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
