import api from "./axios";

export interface Quotation {
    id: string;
    order_id: string;
    quotation_number: string;
    ingredient_cost: string | number;
    labor_cost: string | number;
    overhead_cost: string | number;
    tax_amount: string | number;
    grand_total: string | number;
    is_accepted: boolean;
    valid_until: string;
    created_at: string;
}

export interface Invoice {
    id: string;
    order_id: string;
    invoice_number: string;
    total_amount: string | number;
    paid_amount: string | number;
    pending_amount: string | number;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    due_date: string;
    created_at: string;
}

export interface Payment {
    id: string;
    invoice_id: string;
    amount: string | number;
    payment_method: string;
    payment_date: string;
    reference_number: string;
    notes: string;
}

export const getInvoices = async (page = 1, limit = 50, filters?: any): Promise<Invoice[]> => {
    const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.status) queryParams.append('status', filters.status);
    
    const response = await api.get(`/billing/invoices?${queryParams.toString()}`);
    return response.data.data;
};

export const getQuotations = async (orderId?: string): Promise<Quotation[]> => {
    const queryParams = orderId ? `?order_id=${orderId}` : '';
    const response = await api.get(`/billing/quotations${queryParams}`);
    return response.data.data;
};

export const recordPayment = async (invoiceId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string): Promise<Payment> => {
    const payload = {
        invoice_id: invoiceId,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes
    };
    const response = await api.post(`/billing/payments`, payload);
    return response.data.data;
};

export const getPaymentsForInvoice = async (invoiceId: string): Promise<Payment[]> => {
    const response = await api.get(`/billing/invoices/${invoiceId}/payments`);
    return response.data.data;
};
