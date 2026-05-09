import api from "./axios";

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description: string;
  base_unit: string;
  min_quantity: string | number;
  base_price: number;
  image_url: string | null;
  is_customizable: boolean;
  is_active: boolean;
  created_at: string;
}

export const getCategories = async (): Promise<MenuCategory[]> => {
  const response = await api.get("/menu/categories");
  return response.data.data;
};

export const getMenuItems = async (page = 1, limit = 50): Promise<MenuItem[]> => {
  const response = await api.get(`/menu/items?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const getMenuItemById = async (id: string): Promise<MenuItem> => {
  const response = await api.get(`/menu/items/${id}`);
  return response.data.data;
};

export const createMenuItem = async (data: Partial<MenuItem>): Promise<MenuItem> => {
  const response = await api.post('/menu/items', data);
  return response.data.data;
};

export const updateMenuItem = async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
  const response = await api.put(`/menu/items/${id}`, data);
  return response.data.data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await api.delete(`/menu/items/${id}`);
};

// --- RECIPE MANAGEMENT ---

export interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name?: string;
  unit?: string;
  quantity_per_base_unit: number;
  wastage_factor: number;
  cost_contribution?: number;
  total_cost_with_wastage?: number;
  cost_per_unit?: number;
}

export interface RecipePayload {
  ingredient_id: string;
  quantity_per_base_unit: number;
  wastage_factor?: number;
}

export const getRecipe = async (menuItemId: string): Promise<RecipeIngredient[]> => {
  const response = await api.get(`/menu/items/${menuItemId}/recipe`);
  // Backend returns recipe array inside response.data.data.ingredients
  return response.data.data.ingredients || [];
};

export const addRecipeIngredient = async (menuItemId: string, data: RecipePayload): Promise<RecipeIngredient> => {
  const response = await api.post(`/menu/items/${menuItemId}/recipe`, data);
  return response.data.data;
};

export const removeRecipeIngredient = async (menuItemId: string, ingredientId: string): Promise<void> => {
  // Pass ingredient_id in the body via Axios 'data' config
  await api.delete(`/menu/items/${menuItemId}/recipe`, {
    data: { ingredient_id: ingredientId }
  });
};
