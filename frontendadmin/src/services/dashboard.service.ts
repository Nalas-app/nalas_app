import api from "./axios";

export interface DashboardSummary {
  activeOrders: number;
  totalRevenue: number;
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

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await api.get("/orders");
    const orders = response.data.data || [];
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Active orders are quoted, confirmed, or preparing
    const activeOrders = orders.filter((o: any) => ['quoted', 'confirmed', 'preparing'].includes(o.status)).length;
    
    // Total revenue from all orders (can refine later if only confirmed/completed should count)
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    
    // Today's events based on event_date
    const todaysOrders = orders.filter((o: any) => {
        if (!o.event_date) return false;
        // event_date might be ISO string
        return o.event_date.split('T')[0] === todayStr;
    }).length;
    
    return {
      activeOrders,
      totalRevenue,
      todaysOrders
    };
  } catch (error) {
    console.error("Error calculating dashboard summary:", error);
    return {
      activeOrders: 0,
      totalRevenue: 0,
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
