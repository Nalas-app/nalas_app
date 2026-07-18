"use client";

import { useEffect, useState } from "react";
import { getMLAnalytics, getMLTrends, MLAnalytics, MLTrendsResponse } from "@/services/ml.service";
import { getErrorMessage } from "@/utils/errorHandler";
import Link from "next/link";

export default function MLCostingDashboard() {
    const [analytics, setAnalytics] = useState<MLAnalytics | null>(null);
    const [trends, setTrends] = useState<MLTrendsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        setIsLoading(true);
        setError("");
        try {
            const [analyticsData, trendsData] = await Promise.all([
                getMLAnalytics(),
                getMLTrends(30)
            ]);
            setAnalytics(analyticsData);
            setTrends(trendsData);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 404) {
                setError("The deployed backend does not have the ML Costing module enabled. Please ask the backend team to push the latest code.");
            } else {
                setError(getErrorMessage(err, "Failed to load ML analytics."));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 animate-pulse font-medium">Querying ML Engine...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">ML Cost Intelligence</h1>
                    <p className="text-gray-500 text-sm mt-1">Predictive cost modeling powered by Nalas Engine</p>
                </div>
                <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-bold mb-1">Service Unavailable</h3>
                    <p className="font-medium text-red-600 mb-4">{error}</p>
                    <button onClick={fetchData} className="px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition">
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        ML Cost Intelligence
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 font-bold uppercase tracking-wider">v1.0</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Predictive cost modeling powered by Nalas Engine</p>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-bold text-gray-400 uppercase">Total Predictions</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{analytics?.total_predictions || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-sm font-bold text-blue-600 uppercase">Avg Confidence</p>
                    <p className="text-3xl font-black text-blue-900 mt-2">
                        {analytics?.average_confidence ? `${analytics.average_confidence.toFixed(1)}%` : 'N/A'}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-bold text-gray-400 uppercase">Avg Total Cost</p>
                    <p className="text-3xl font-black text-[#689F38] mt-2">
                        ₹{analytics?.cost_analysis.average_total_cost.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-bold text-gray-400 uppercase">Avg Labor Cost</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">
                        ₹{analytics?.cost_breakdown.average_labor_cost.toLocaleString(undefined, {maximumFractionDigits: 0}) || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-50 pb-2">Cost Breakdown</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-1">
                                <span className="text-gray-700">Ingredients</span>
                                <span className="text-gray-900">₹{analytics?.cost_breakdown.average_ingredient_cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-[#689F38] h-2.5 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-1">
                                <span className="text-gray-700">Labor</span>
                                <span className="text-gray-900">₹{analytics?.cost_breakdown.average_labor_cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm font-bold mb-1">
                                <span className="text-gray-700">Overhead</span>
                                <span className="text-gray-900">₹{analytics?.cost_breakdown.average_overhead_cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trends Display */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-50 pb-2">30-Day Cost Trend Overview</h3>
                    
                    {trends?.daily_trends && trends.daily_trends.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs font-bold text-gray-500 pb-3">Date</th>
                                        <th className="text-center text-xs font-bold text-gray-500 pb-3">Avg Total</th>
                                        <th className="text-center text-xs font-bold text-gray-500 pb-3">Ingredients</th>
                                        <th className="text-right text-xs font-bold text-gray-500 pb-3">Vol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {trends.daily_trends.slice(0, 7).map((trend, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="py-3 text-sm font-bold text-gray-900">{new Date(trend.date).toLocaleDateString()}</td>
                                            <td className="py-3 text-center text-sm font-black text-[#689F38]">₹{trend.avg_total_cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                            <td className="py-3 text-center text-sm font-medium text-gray-600">₹{trend.avg_ingredient_cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                            <td className="py-3 text-right text-sm font-bold text-gray-500">{trend.order_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {trends.daily_trends.length > 7 && (
                                <p className="text-center text-xs text-gray-400 mt-4 italic">Showing latest 7 days...</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 font-medium">Not enough historical data to generate trends.</p>
                            <p className="text-xs text-gray-400 mt-1">Generate more quotations to build the dataset.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
