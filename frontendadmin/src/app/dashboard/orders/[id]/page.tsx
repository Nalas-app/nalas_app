"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    getOrderById, 
    generateQuotation, 
    confirmOrder, 
    updateOrderStatus
} from "@/services/orders.service";
import { getQuotations, getQuotationById, recordPayment, getInvoices } from "@/services/billing.service";
import { getErrorMessage } from "@/utils/errorHandler";
import Link from "next/link";

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    
    // For showing quotation details right after generation
    const [quotationDetails, setQuotationDetails] = useState<any>(null);
    const [invoiceDetails, setInvoiceDetails] = useState<any>(null);

    const fetchOrder = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await getOrderById(orderId);
            setOrder(data);
            
            // If order has a quotation, fetch it to show the breakdown persistently
            if (data.status !== 'draft') {
                const quotes = await getQuotations(orderId);
                if (quotes && quotes.length > 0) {
                    try {
                        const fullQuote = await getQuotationById(quotes[0].id);
                        setQuotationDetails((prev: any) => {
                            // If we already have the richer generateQuotation response, keep it
                            if (prev && prev.is_ml_predicted !== undefined) return prev;
                            return fullQuote;
                        });
                    } catch (e) {
                        setQuotationDetails(quotes[0]);
                    }
                }
            }
            // If order has an invoice, fetch it to show payment details
            if (['confirmed', 'preparing', 'completed'].includes(data.status)) {
                try {
                    const invoices = await getInvoices(1, 10, { order_id: orderId });
                    if (invoices && invoices.length > 0) {
                        setInvoiceDetails(invoices[0]);
                        // Patch the order's advance_paid with the invoice's paid_amount
                        data.advance_paid = invoices[0].paid_amount;
                    }
                } catch (e) {
                    console.warn("Failed to fetch invoice for order", e);
                }
            }
            
            setOrder(data);
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err, "Failed to load order details."));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const handleGenerateQuotation = async () => {
        if (!confirm("Are you sure you want to generate a quotation? This will use ML to predict costs and lock the draft.")) return;
        
        setActionLoading(true);
        setError("");
        try {
            const response = await generateQuotation(orderId);
            setQuotationDetails(response);
            await fetchOrder(); // Refresh the status and total
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 404) {
                setError("The deployed backend does not seem to support Quotation Generation yet. Please ask the backend team to update the server code.");
            } else {
                setError(getErrorMessage(err, "Failed to generate quotation."));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!confirm("Confirming this order will permanently reserve stock inventory and generate an official invoice. Proceed?")) return;
        
        // Ask for Advance or Full Payment
        let advanceAmount = 0;
        const advanceInput = prompt("Enter Payment Amount collected (Advance or Full Total in ₹):\n(Leave blank or enter 0 if no payment was made yet)");
        if (advanceInput !== null && advanceInput.trim() !== "") {
            advanceAmount = parseFloat(advanceInput);
            if (isNaN(advanceAmount) || advanceAmount < 0) {
                alert("Invalid advance amount entered. Proceeding without recording an advance.");
                advanceAmount = 0;
            }
        }
        
        setActionLoading(true);
        setError("");
        try {
            const response = await confirmOrder(orderId);
            setInvoiceDetails(response.invoice);
            
            // If advance was collected, record it to the newly generated invoice
            if (advanceAmount > 0 && response.invoice?.id) {
                try {
                    await recordPayment(
                        response.invoice.id,
                        advanceAmount,
                        "cash", // default to cash for quick advance
                        "", // pass empty string instead of undefined
                        "Initial Advance Payment"
                    );
                } catch (paymentErr: any) {
                    // Do not use console.error to avoid Next.js dev overlay, use console.warn instead
                    console.warn("Failed to record advance payment", paymentErr?.message || paymentErr);
                    alert("Order confirmed, but failed to log the advance payment automatically due to a server error. Please log it manually in the Billing page.");
                }
            }

            await fetchOrder(); // Refresh the status
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 404) {
                setError("The deployed backend does not seem to support Order Confirmation yet. Please update the server code.");
            } else {
                setError(getErrorMessage(err, "Failed to confirm order. Stock might be insufficient."));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm("Are you sure you want to cancel this order? Any reserved stock will be released.")) return;
        
        setActionLoading(true);
        setError("");
        try {
            await updateOrderStatus(orderId, 'cancelled');
            await fetchOrder();
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err, "Failed to cancel order."));
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading fulfillment profile...</p>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-100 flex flex-col items-center">
                <span className="font-bold text-lg mb-2">System Error</span>
                <span>{error}</span>
                <Link href="/dashboard/orders" className="mt-4 px-4 py-2 bg-white text-red-700 border border-red-200 rounded font-bold hover:bg-red-50">Back to Pipeline</Link>
            </div>
        );
    }

    if (!order) return null;

    // Determine status color
    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-800 border-gray-200',
        quoted: 'bg-blue-50 text-blue-700 border-blue-200',
        confirmed: 'bg-[#689F38]/10 text-[#558B2F] border-[#689F38]/20',
        preparing: 'bg-amber-100 text-amber-800 border-amber-200',
        completed: 'bg-teal-100 text-teal-800 border-teal-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    const StatusBadge = () => (
        <span className={`px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wide border ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
            {order.status}
        </span>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/orders" className="text-gray-400 hover:text-[#689F38] transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-2xl font-extrabold text-gray-900">Order Manifest</h1>
                        <StatusBadge />
                    </div>
                    <p className="text-sm text-gray-500 font-mono ml-9">ID: {order.id}</p>
                </div>

                <div className="flex gap-3">
                    {order.status === 'draft' && (
                        <button 
                            onClick={handleGenerateQuotation}
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-blue-600/20 transition flex items-center disabled:opacity-70"
                        >
                            {actionLoading ? "Processing ML..." : "Mint ML Quotation"}
                        </button>
                    )}
                    {order.status === 'quoted' && (
                        <button 
                            onClick={handleConfirmOrder}
                            disabled={actionLoading}
                            className="bg-[#689F38] hover:bg-[#558B2F] text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-[#689F38]/20 transition flex items-center disabled:opacity-70"
                        >
                            {actionLoading ? "Reserving Stock..." : "Confirm & Reserve Stock"}
                        </button>
                    )}
                    {(order.status === 'draft' || order.status === 'quoted' || order.status === 'confirmed' || order.status === 'preparing') && (
                        <button 
                            onClick={handleCancelOrder}
                            disabled={actionLoading}
                            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg font-bold transition disabled:opacity-70"
                        >
                            Abort
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg font-medium border border-red-200">
                    {error}
                </div>
            )}

            {/* If quotation details are available in memory, show them prominently */}
            {quotationDetails && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-extrabold text-blue-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                ML Quotation Minted
                            </h2>
                            <p className="text-blue-700/80 text-sm mt-1">
                                {quotationDetails.is_ml_predicted !== undefined 
                                    ? (quotationDetails.is_ml_predicted 
                                        ? `Cost predictions powered by Nalas ML Engine (Avg Confidence: ${quotationDetails.ml_confidence}%)`
                                        : 'Cost predictions fell back to static recipe calculation.')
                                    : 'Costing generated via dynamically mapped pricing intelligence.'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-widest">Grand Total</p>
                            <p className="text-3xl font-black text-blue-900">₹{Number(quotationDetails.quotation?.grand_total || quotationDetails.grand_total || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200/50">
                        <div>
                            <p className="text-xs font-bold text-blue-800/70 uppercase">Ingredient Cost</p>
                            <p className="text-lg font-bold text-blue-900">
                                ₹{(() => {
                                    const q = quotationDetails.quotation || quotationDetails;
                                    const breakdown = q.breakdown || q;
                                    // If ingredient_cost is missing, calculate it from subtotal - labor_cost
                                    const cost = breakdown.ingredient_cost || (Number(breakdown.subtotal || 0) - Number(breakdown.labor_cost || 0));
                                    return Number(cost || 0).toLocaleString();
                                })()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-800/70 uppercase">Labor Cost</p>
                            <p className="text-lg font-bold text-blue-900">
                                ₹{(() => {
                                    const q = quotationDetails.quotation || quotationDetails;
                                    const breakdown = q.breakdown || q;
                                    return Number(breakdown.labor_cost || 0).toLocaleString();
                                })()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-800/70 uppercase">Overheads & Tax</p>
                            <p className="text-lg font-bold text-blue-900">
                                ₹{(() => {
                                    const q = quotationDetails.quotation || quotationDetails;
                                    const breakdown = q.breakdown || q;
                                    const overhead = Number(breakdown.overhead_cost || 0);
                                    const tax = Number(breakdown.tax_amount || 0);
                                    return (overhead + tax).toLocaleString();
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Event Logistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">Event Logistics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-medium text-sm">Date & Time</span>
                            <span className="text-gray-900 font-bold">{new Date(order.event_date).toLocaleDateString()} @ {order.event_time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-medium text-sm">Event Type</span>
                            <span className="text-gray-900 font-bold capitalize">{order.event_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-medium text-sm">Guest Count</span>
                            <span className="text-gray-900 font-bold bg-orange-50 text-orange-700 px-2 rounded">{order.guest_count} pax</span>
                        </div>
                        <div className="pt-2">
                            <span className="text-gray-500 font-medium text-sm block mb-1">Venue Address</span>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">{order.venue_address}</p>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">Financial Ledger</h3>
                    
                    <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                            <p className="text-gray-500 font-medium mb-1">Current Ledger Total</p>
                            <p className="text-4xl font-black text-gray-900">
                                {order.status === 'draft' ? 'TBD' : `₹${parseFloat(order.total_amount || 0).toLocaleString()}`}
                            </p>
                            {order.status === 'draft' && (
                                <p className="text-sm text-gray-400 mt-2">Generate quotation to predict costs</p>
                            )}
                        </div>
                    </div>

                    {invoiceDetails && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 font-bold flex justify-between">
                                <span>Official Invoice</span>
                                <span>#{invoiceDetails.invoice_number}</span>
                            </p>
                            <p className="text-xs text-green-600 mt-1">Due: {new Date(invoiceDetails.due_date).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-extrabold text-gray-900">Cart Requirements</h3>
                    <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">{order.items?.length || 0} unique items</span>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Item ID</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Line Value</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {order.items?.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-extrabold text-gray-900">{item.name || 'Unknown Item'}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{item.menu_item_id}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                                        {item.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-medium text-gray-500">
                                        {order.status === 'draft' ? (
                                            <span className="italic text-gray-400">TBD</span>
                                        ) : (
                                            `₹${(parseFloat(item.unit_price) * item.quantity).toLocaleString()}`
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Audit Trail */}
            {order.status_history && order.status_history.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-50 pb-2">Fulfillment Audit Trail</h3>
                    <div className="space-y-6">
                        {order.status_history.map((log: any, index: number) => (
                            <div key={index} className="flex">
                                <div className="flex flex-col items-center mr-4">
                                    <div className="w-3 h-3 bg-[#689F38] rounded-full"></div>
                                    {index !== order.status_history.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                                </div>
                                <div className="pb-6">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-sm font-bold text-gray-900 uppercase">{log.new_status}</p>
                                        <p className="text-xs text-gray-400 font-mono">{new Date(log.changed_at || log.created_at || new Date()).toLocaleString()}</p>
                                    </div>
                                    {log.notes && <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded inline-block border border-gray-100">{log.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
