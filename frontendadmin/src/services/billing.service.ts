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
    pdf_url?: string;
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
    pdf_url?: string;
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
    if (filters?.order_id) queryParams.append('order_id', filters.order_id);
    
    const response = await api.get(`/billing/invoices?${queryParams.toString()}`);
    
    // WORKAROUND: Backend list API returns payment_status instead of status, 
    // invoice_date instead of created_at, and completely omits due_date.
    return response.data.data.map((inv: any) => {
        // Since backend sets due_date to 15 days after creation, we compute it here if missing
        const computedDueDate = inv.invoice_date 
            ? new Date(new Date(inv.invoice_date).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
            : new Date().toISOString();
            
        return {
            ...inv,
            status: inv.payment_status || 'pending',
            created_at: inv.invoice_date,
            due_date: inv.due_date || computedDueDate
        };
    });
};

export const getQuotations = async (orderId?: string): Promise<Quotation[]> => {
    const queryParams = orderId ? `?order_id=${orderId}` : '';
    const response = await api.get(`/billing/quotations${queryParams}`);
    return response.data.data;
};

export const getQuotationById = async (quotationId: string): Promise<any> => {
    const response = await api.get(`/billing/quotations/${quotationId}`);
    return response.data.data;
};

export const createQuotation = async (orderId: string, applyGst: boolean = false): Promise<any> => {
    const payload = {
        order_id: orderId,
        apply_gst: applyGst
    };
    const response = await api.post('/billing/quotations', payload);
    return response.data.data;
};

export const recordPayment = async (invoiceId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string, paymentType?: string): Promise<Payment> => {
    const payload: any = {
        invoice_id: invoiceId,
        amount,
        payment_method: paymentMethod,
        transaction_id: referenceNumber,
        notes
    };
    if (paymentType) {
        payload.payment_type = paymentType;
    }
    const response = await api.post(`/billing/payments`, payload);
    return response.data.data;
};

export const getPaymentsForInvoice = async (invoiceId: string): Promise<Payment[]> => {
    const response = await api.get(`/billing/invoices/${invoiceId}/payments`);
    return response.data.data;
};

export const getInvoiceQR = async (invoiceId: string): Promise<{ qr_data_url: string }> => {
    const response = await api.get(`/billing/invoices/${invoiceId}/qr`);
    return response.data.data;
};

export const getBlankQR = async (): Promise<{ qr_data_url: string }> => {
    const response = await api.get(`/billing/qr/blank`);
    return response.data.data;
};
