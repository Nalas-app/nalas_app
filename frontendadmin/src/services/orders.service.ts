import api from "./axios";

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  event_date: string;
  event_time: string;
  event_type: string;
  guest_count: number;
  venue_address: string;
  status: 'draft' | 'quoted' | 'confirmed' | 'preparing' | 'completed' | 'cancelled';
  total_amount: string | number;
  advance_paid: string | number;
  created_at: string;
}

export const getOrders = async (page = 1, limit = 50, filters?: any): Promise<Order[]> => {
  const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.from_date) queryParams.append('from_date', filters.from_date);
  if (filters?.to_date) queryParams.append('to_date', filters.to_date);
  
  const response = await api.get(`/orders?${queryParams.toString()}`);
  return response.data.data;
};

export const getOrderById = async (id: string): Promise<any> => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data;
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<Order> => {
  const response = await api.put(`/orders/${id}/status`, { status });
  return response.data.data;
};

export const generateQuotation = async (id: string): Promise<any> => {
  const response = await api.post(`/orders/${id}/quotation`);
  return response.data.data;
};

export const confirmOrder = async (id: string): Promise<any> => {
  const response = await api.post(`/orders/${id}/confirm`);
  return response.data.data;
};

export interface CreateOrderPayload {
  event_date: string;
  event_time: string;
  event_type: string;
  guest_count: number;
  venue_address: string;
  special_requests?: string;
  order_items: {
    menu_item_id: string;
    quantity: number;
    customizations?: Record<string, any>;
  }[];
}

export const createOrder = async (data: CreateOrderPayload): Promise<Order> => {
  const response = await api.post('/orders', data);
  return response.data.data;
};
