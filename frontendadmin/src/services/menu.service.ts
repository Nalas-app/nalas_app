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
