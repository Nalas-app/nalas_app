import api from "./axios";

export interface QuotationConfig {
  labour_cost_per_guest?: number | "";
  lpg_cost_per_guest?: number | "";
  transport_flat?: number | "";
  leaf_cost_per_guest?: number | "";
  disposables_cost_per_guest?: number | "";
  overhead_percentage?: number | "";
  profit_percentage?: number | "";
  gst_percentage?: number | "";
}

export interface BusinessInfo {
  business_name?: string;
  gstin?: string;
  upi_id?: string;
  upi_payee_name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface SmtpConfig {
  host?: string;
  port?: number | "";
  user?: string;
  pass?: string;
  from_name?: string;
}

export interface SettingsData {
  quotation_config?: QuotationConfig;
  business_info?: BusinessInfo;
  smtp_config?: SmtpConfig;
}

export const getAllSettings = async (): Promise<SettingsData> => {
  const response = await api.get("/settings");
  // Transform array of {key, value} into an object map
  const settingsArray = response.data.data || [];
  const settingsMap: any = {};
  
  settingsArray.forEach((item: { key: string, value: any }) => {
    settingsMap[item.key] = item.value;
  });
  
  return settingsMap as SettingsData;
};

export const updateSetting = async (key: string, data: any): Promise<any> => {
  const response = await api.put(`/settings/${key}`, data);
  return response.data.data;
};
