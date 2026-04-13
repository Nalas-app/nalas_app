import api from "./axios";

export interface StockLevel {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  price_per_unit: string | number;
  available_quantity: string | number;
  reserved_quantity: string | number;
  usable_quantity: string | number;
}

export interface StockTransactionPayload {
  ingredient_id: string;
  transaction_type: 'purchase' | 'consumption' | 'wastage' | 'adjustment';
  quantity: number;
  unit_price?: number;
  notes?: string;
}

export const getAllStockLevels = async (page = 1, limit = 100): Promise<StockLevel[]> => {
  const response = await api.get(`/stock/current?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const recordTransaction = async (data: StockTransactionPayload): Promise<any> => {
  const response = await api.post("/stock/transactions", data);
  return response.data.data;
};

export interface IngredientPayload {
  name: string;
  unit: string;
  current_price_per_unit: number;
  reorder_level: number;
  is_perishable: boolean;
  shelf_life_days?: number;
}

export const createIngredient = async (data: IngredientPayload): Promise<any> => {
  const response = await api.post("/stock/ingredients", data);
  return response.data.data;
};
