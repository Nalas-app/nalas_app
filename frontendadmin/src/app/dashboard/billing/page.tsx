"use client";

import { useEffect, useState } from "react";
import { 
    getInvoices, 
    recordPayment,
    Invoice
} from "@/services/billing.service";
import Link from "next/link";

export default function BillingManagementPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [transactionId, setTransactionId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const fetched = await getInvoices();
            setInvoices(fetched || []);
        } catch (err: any) {
            console.error("Failed to load invoices:", err);
            setError("Failed to fetch invoices from the server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'partial': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentAmount(Number(invoice.pending_amount));
        setPaymentMethod("bank_transfer");
        setTransactionId("");
        setIsPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
    };

    const handlePrintInvoice = (inv: Invoice) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Invoice #${inv.invoice_number}</title>
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                            h1 { color: #689F38; margin: 0; font-size: 32px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                            th, td { padding: 15px 10px; border-bottom: 1px solid #eee; text-align: left; }
                            th { background: #f9fafb; color: #666; text-transform: uppercase; font-size: 12px; }
                            .status { display: inline-block; padding: 5px 10px; border-radius: 4px; background: #f3f4f6; font-weight: bold; text-transform: uppercase; font-size: 12px; border: 1px solid #e5e7eb; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div>
                                <h1>NALAS</h1>
                                <p style="color: #666; margin-top: 5px;">Premium Catering Services</p>
                            </div>
                            <div style="text-align: right">
                                <h2 style="margin: 0; color: #374151;">INVOICE</h2>
                                <p style="font-weight: bold; font-size: 18px; margin: 5px 0;">#${inv.invoice_number}</p>
                                <p style="margin: 5px 0; color: #666;">Date: ${new Date(inv.invoice_date).toLocaleDateString()}</p>
                                <p style="margin: 10px 0 0 0;"><span class="status">${inv.status}</span></p>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 40px; background: #f9fafb; padding: 20px; border-radius: 8px;">
                            <h3 style="margin-top: 0; color: #374151;">Bill To:</h3>
                            <p style="margin: 5px 0; font-family: monospace;">Order Ref: ${inv.order_id}</p>
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Event Catering Services & Logistics<br><span style="color: #666; font-size: 12px;">As per confirmed order manifest.</span></td>
                                    <td style="text-align: right; font-weight: bold;">Rs. ${Number(inv.total_amount).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="text-align: right; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee;">
                            <p style="margin: 5px 0; color: #4b5563;"><strong>Subtotal:</strong> Rs. ${Number(inv.total_amount).toLocaleString()}</p>
                            <p style="margin: 5px 0; color: #059669;"><strong>Advance/Paid:</strong> Rs. ${Number(inv.paid_amount || 0).toLocaleString()}</p>
                            <p style="font-size: 24px; color: #dc2626; margin: 15px 0 5px 0;">
                                <strong>Amount Due:</strong> Rs. ${Number(inv.pending_amount).toLocaleString()}
                            </p>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Due Date: ${new Date(inv.due_date).toLocaleDateString()}</p>
                        </div>
                        
                        <div style="margin-top: 80px; text-align: center; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 20px;">
                            <p style="font-weight: bold; margin-bottom: 5px;">Thank you for choosing Nalas!</p>
                            <p style="font-size: 12px;">This is a computer-generated invoice and does not require a physical signature.</p>
                        </div>
                        
                        <script>
                            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        
        setIsSubmitting(true);
        try {
            await recordPayment(
                selectedInvoice.id, 
                paymentAmount, 
                paymentMethod, 
                transactionId || "", 
                "Payment"
            );
            await fetchInvoices();
            closePaymentModal();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to record payment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Loading Financial Ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Billing & Invoices</h1>
                    <p className="text-gray-500 text-sm mt-1">Track payments, manage debts, and record financial transactions.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100">
                    {error}
                </div>
            )}

            {/* Invoices Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {invoices.length === 0 ? (
                        <div className="p-16 text-center">
                            <h3 className="text-lg font-medium text-gray-900">No invoices generated yet</h3>
                            <p className="text-gray-500">Confirm an order to automatically generate an invoice.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Details</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Financials</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-extrabold text-gray-900 uppercase">#{inv.invoice_number}</div>
                                            <div className="text-xs text-blue-600 font-bold mt-1">
                                                <Link href={`/dashboard/orders/${inv.order_id}`} className="hover:underline">
                                                    View Order
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-800">{new Date(inv.due_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="text-sm font-extrabold text-gray-900">₹{Number(inv.total_amount).toLocaleString()}</div>
                                            {Number(inv.pending_amount) > 0 ? (
                                                <div className="text-xs font-bold text-red-600 mt-1">Pending: ₹{Number(inv.pending_amount).toLocaleString()}</div>
                                            ) : (
                                                <div className="text-xs font-bold text-green-600 mt-1">Fully Paid</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handlePrintInvoice(inv)}
                                                    className="bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 transition-colors flex items-center gap-1"
                                                    title="Download/Print PDF"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    Bill
                                                </button>
                                                
                                                {['pending', 'partial', 'overdue'].includes(inv.status) && (
                                                    <button 
                                                        onClick={() => openPaymentModal(inv)}
                                                        className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-200 transition-colors"
                                                    >
                                                        Pay
                                                    </button>
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
            {isPaymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closePaymentModal}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-900">Record Payment</h2>
                                <p className="text-sm text-blue-700 font-medium">For Invoice #{selectedInvoice.invoice_number}</p>
                            </div>
                            <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount to Pay (₹)</label>
                                    <input 
                                        type="number" 
                                        required min="1" step="0.01" max={Number(selectedInvoice.pending_amount)}
                                        value={paymentAmount || ''}
                                        onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Max pending: ₹{Number(selectedInvoice.pending_amount)}</p>
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
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">
                                        {isSubmitting ? "Processing..." : "Confirm Payment"}
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
