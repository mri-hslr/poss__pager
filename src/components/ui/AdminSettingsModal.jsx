import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard, User } from 'lucide-react';
import { getTheme, COMMON_STYLES } from './theme';

export default function AdminSettingsModal({ open, onClose, API_URL, restaurantId, isDarkMode }) {
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = getTheme(isDarkMode || true); // Default to dark mode for modal consistency

  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try { const token = localStorage.getItem("auth_token"); if (!API_URL) return; const res = await fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { const data = await res.json(); setUpiId(data.upi_id || ""); setPayeeName(data.payee_name || ""); } } catch (e) { console.error(e); }
      };
      fetchSettings();
    }
  }, [open, API_URL]);

  const handleSave = async () => {
    setLoading(true);
    try { const token = localStorage.getItem("auth_token"); const res = await fetch(`${API_URL}/settings`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ upi_id: upiId, payee_name: payeeName, restaurantId }) }); if (!res.ok) throw new Error("Failed"); alert("Settings Saved!"); onClose(); } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${COMMON_STYLES.modal(isDarkMode || true)}`}>
        <div className={`p-5 border-b flex justify-between items-center ${theme.border.default}`}><h2 className="text-lg font-semibold">System Settings</h2><button onClick={onClose} className={`p-2 rounded-lg ${theme.button.ghost}`}><X size={20} /></button></div>
        <div className="p-6 space-y-4">
            <div><label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>UPI ID</label><div className="relative"><CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} size={18}/><input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="merchant@upi" className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode || true)}`} /></div></div>
            <div><label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>Payee Name</label><div className="relative"><User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} size={18}/><input value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Business Name" className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode || true)}`} /></div></div>
        </div>
        <div className={`p-5 border-t flex justify-end gap-3 ${theme.border.default} ${theme.bg.main}`}><button onClick={onClose} className={`px-4 py-2 rounded-lg font-medium ${theme.button.secondary}`}>Cancel</button><button onClick={handleSave} disabled={loading} className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${theme.button.primary}`}><Save size={18}/> {loading ? "Saving..." : "Save"}</button></div>
      </div>
    </div>
  );
}