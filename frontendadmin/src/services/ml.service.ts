import api from "./axios";

export interface MLAnalytics {
  total_predictions: number;
  cost_analysis: {
    average_total_cost: number;
    min_cost: number;
    max_cost: number;
  };
  cost_breakdown: {
    average_ingredient_cost: number;
    average_labor_cost: number;
    average_overhead_cost: number;
  };
  average_confidence: number;
  period: {
    from: string;
    to: string;
  };
}

export interface MLTrend {
  date: string;
  avg_total_cost: number;
  avg_ingredient_cost: number;
  avg_labor_cost: number;
  order_count: number;
}

export interface MLTrendsResponse {
  period_days: number;
  total_records: number;
  daily_trends: MLTrend[];
}

export const getMLAnalytics = async (fromDate?: string, toDate?: string): Promise<MLAnalytics> => {
  const params = new URLSearchParams();
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  
  const response = await api.get(`/ml-costing/analytics?${params.toString()}`);
  return response.data.data;
};

export const getMLTrends = async (days: number = 30): Promise<MLTrendsResponse> => {
  const response = await api.get(`/ml-costing/trends?days=${days}`);
  return response.data.data;
};
