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
  const response = await api.get("/orders/dashboard-summary");
  // The API returns { success: true, message: "...", data: { activeOrders, totalRevenue, todaysOrders } }
  return response.data.data;
};

export const getProcurementAlerts = async (): Promise<ProcurementAlert[]> => {
  const response = await api.get("/stock/alerts/procurement");
  return response.data.data;
};
