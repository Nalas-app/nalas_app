import api from "./axios";

export interface DashboardSummary {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  advanceCollected: number;
  todaysOrders: number;
}

export interface ProcurementAlert {
  ingredient_id: string;
  name: string;
  available_quantity: string | number;
  reorder_level: string | number;
  unit: string;
  deficit: number;
}

export const getDashboardSummary = async (fromDate?: string, toDate?: string): Promise<DashboardSummary> => {
  try {
    const queryParams = new URLSearchParams({ limit: '100' });
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);

    const response = await api.get(`/orders?${queryParams.toString()}`);
    const orders = response.data.data || [];
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    const activeOrders = orders.filter((o: any) => ['quoted', 'confirmed', 'preparing'].includes(o.status)).length;
    
    // Total revenue from all orders (can refine later if only confirmed/completed should count)
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    
    const advanceCollected = orders.reduce((sum: number, o: any) => sum + (Number(o.advance_paid) || 0), 0);

    // Today's events based on event_date
    const todaysOrders = orders.filter((o: any) => {
        if (!o.event_date) return false;
        // event_date might be ISO string
        return o.event_date.split('T')[0] === todayStr;
    }).length;
    
    return {
      totalOrders: orders.length,
      activeOrders,
      totalRevenue,
      advanceCollected,
      todaysOrders
    };
  } catch (error) {
    console.error("Error calculating dashboard summary:", error);
    return {
      totalOrders: 0,
      activeOrders: 0,
      totalRevenue: 0,
      advanceCollected: 0,
      todaysOrders: 0
    };
  }
};

export const getProcurementAlerts = async (): Promise<ProcurementAlert[]> => {
  const response = await api.get("/stock/alerts/procurement");
  const data = response.data.data || [];
  
  return data.map((item: any) => ({
    ingredient_id: item.ingredient_id,
    name: item.ingredient_name || item.name, // Fallback if name is provided
    available_quantity: item.current_level !== undefined ? item.current_level : item.available_quantity,
    reorder_level: item.reorder_level,
    unit: item.unit,
    deficit: Number(item.reorder_level) - Number(item.current_level !== undefined ? item.current_level : item.available_quantity)
  }));
};
