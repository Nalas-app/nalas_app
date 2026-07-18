"use client";

import { useEffect, useState } from "react";
import { 
  getAllSettings, 
  updateSetting, 
  QuotationConfig, 
  BusinessInfo, 
  SmtpConfig 
} from "@/services/settings.service";
import theme from "@/utils/theme";
import { getErrorMessage } from "@/utils/errorHandler";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // States
  const [quotationConfig, setQuotationConfig] = useState<QuotationConfig>({
    labour_cost_per_guest: "",
    lpg_cost_per_guest: "",
    transport_flat: "",
    leaf_cost_per_guest: "",
    disposables_cost_per_guest: "",
    overhead_percentage: "",
    profit_percentage: "",
    gst_percentage: ""
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: "",
    gstin: "",
    upi_id: "",
    upi_payee_name: "",
    address: "",
    phone: "",
    email: ""
  });

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "",
    port: "",
    user: "",
    pass: "",
    from_name: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSettings();
      if (data.quotation_config) {
        setQuotationConfig({ ...quotationConfig, ...data.quotation_config });
      }
      if (data.business_info) {
        setBusinessInfo({ ...businessInfo, ...data.business_info });
      }
      if (data.smtp_config) {
        setSmtpConfig({ ...smtpConfig, ...data.smtp_config });
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load settings"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (key: string, data: any, e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting({ ...isSubmitting, [key]: true });

    try {
      // Ensure empty strings are handled if needed, or pass as is.
      // For SMTP pass, if it is empty, we don't update it.
      const payload = { ...data };
      if (key === 'smtp_config' && !payload.pass) {
        delete payload.pass;
      }

      await updateSetting(key, payload);
      setSuccessMsg(`Successfully updated ${key.replace('_', ' ')}!`);
      // Refresh to get updated values
      await fetchSettings();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, `Failed to update ${key}`));
    } finally {
      setIsSubmitting({ ...isSubmitting, [key]: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-500 font-medium mt-1">Configure formulas, business details, and integrations</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-100 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <div className="space-y-8">
        
        {/* QUOTATION CONFIG */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#689F38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Quotation Configuration
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage global formulas and default percentages for quotations.</p>
          </div>
          <div className="p-6">
            <form onSubmit={(e) => handleUpdate("quotation_config", quotationConfig, e)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Labour per guest (₹)</label>
                  <input type="number" step="0.01" value={quotationConfig.labour_cost_per_guest} onChange={e => setQuotationConfig({...quotationConfig, labour_cost_per_guest: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">LPG per guest (₹)</label>
                  <input type="number" step="0.01" value={quotationConfig.lpg_cost_per_guest} onChange={e => setQuotationConfig({...quotationConfig, lpg_cost_per_guest: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Transport Flat Fee (₹)</label>
                  <input type="number" step="0.01" value={quotationConfig.transport_flat} onChange={e => setQuotationConfig({...quotationConfig, transport_flat: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Leaf per guest (₹)</label>
                  <input type="number" step="0.01" value={quotationConfig.leaf_cost_per_guest} onChange={e => setQuotationConfig({...quotationConfig, leaf_cost_per_guest: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Disposables per guest (₹)</label>
                  <input type="number" step="0.01" value={quotationConfig.disposables_cost_per_guest} onChange={e => setQuotationConfig({...quotationConfig, disposables_cost_per_guest: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Overhead Percentage (%)</label>
                  <input type="number" step="0.01" value={quotationConfig.overhead_percentage} onChange={e => setQuotationConfig({...quotationConfig, overhead_percentage: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Profit Percentage (%)</label>
                  <input type="number" step="0.01" value={quotationConfig.profit_percentage} onChange={e => setQuotationConfig({...quotationConfig, profit_percentage: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Default GST (%)</label>
                  <input type="number" step="0.01" value={quotationConfig.gst_percentage} onChange={e => setQuotationConfig({...quotationConfig, gst_percentage: e.target.value ? Number(e.target.value) : ""})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting["quotation_config"]} className="bg-[#689F38] hover:bg-[#558B2F] text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center min-w-[140px] justify-center">
                  {isSubmitting["quotation_config"] ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Save Quotation"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* BUSINESS INFO */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#689F38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Business Information
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage core details like GSTIN and UPI endpoints for billing.</p>
          </div>
          <div className="p-6">
            <form onSubmit={(e) => handleUpdate("business_info", businessInfo, e)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Business Name</label>
                  <input type="text" value={businessInfo.business_name} onChange={e => setBusinessInfo({...businessInfo, business_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">GSTIN</label>
                  <input type="text" value={businessInfo.gstin} onChange={e => setBusinessInfo({...businessInfo, gstin: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">UPI ID</label>
                  <input type="text" value={businessInfo.upi_id} onChange={e => setBusinessInfo({...businessInfo, upi_id: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">UPI Payee Name</label>
                  <input type="text" value={businessInfo.upi_payee_name} onChange={e => setBusinessInfo({...businessInfo, upi_payee_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                  <input type="text" value={businessInfo.phone} onChange={e => setBusinessInfo({...businessInfo, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input type="email" value={businessInfo.email} onChange={e => setBusinessInfo({...businessInfo, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                  <textarea rows={2} value={businessInfo.address} onChange={e => setBusinessInfo({...businessInfo, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm"></textarea>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting["business_info"]} className="bg-[#689F38] hover:bg-[#558B2F] text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center min-w-[140px] justify-center">
                  {isSubmitting["business_info"] ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Save Business"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* EMAIL CONFIG */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#689F38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email (SMTP) Configuration
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configure automated mailing for invoices and notifications.</p>
          </div>
          <div className="p-6">
            <form onSubmit={(e) => handleUpdate("smtp_config", smtpConfig, e)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SMTP Host</label>
                  <input type="text" value={smtpConfig.host} onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})} placeholder="e.g. smtp.gmail.com" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SMTP Port</label>
                  <input type="number" value={smtpConfig.port} onChange={e => setSmtpConfig({...smtpConfig, port: e.target.value ? Number(e.target.value) : ""})} placeholder="e.g. 587" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">From Name</label>
                  <input type="text" value={smtpConfig.from_name} onChange={e => setSmtpConfig({...smtpConfig, from_name: e.target.value})} placeholder="e.g. Nalas Inn" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">SMTP User / Email</label>
                  <input type="email" value={smtpConfig.user} onChange={e => setSmtpConfig({...smtpConfig, user: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SMTP App Password</label>
                  <input type="password" value={smtpConfig.pass} onChange={e => setSmtpConfig({...smtpConfig, pass: e.target.value})} placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#689F38]/50 focus:border-[#689F38] text-gray-900 bg-white shadow-sm" />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to keep unchanged</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting["smtp_config"]} className="bg-[#689F38] hover:bg-[#558B2F] text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md shadow-[#689F38]/20 flex items-center min-w-[140px] justify-center">
                  {isSubmitting["smtp_config"] ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Save Email"}
                </button>
              </div>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}
