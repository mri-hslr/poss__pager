import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';

// ✅ FIX: Add API_URL to props here
export default function AdminSettingsModal({ open, onClose, API_URL }) {
  
  // ❌ DELETE THIS LINE if it exists:
  // const API_URL = "http://localhost:3000"; 

  const [settings, setSettings] = useState({
    upi_id: '',
    payee_name: '',
    currency: 'INR'
  });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("auth_token");

  // 1. Load Settings on Open
  useEffect(() => {
    if (open) {
      // ✅ Use the passed API_URL
      fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && !data.message) setSettings(data);
      })
      .catch(err => console.error("Failed to load settings", err));
    }
  }, [open, API_URL, token]); // Add API_URL to dependencies

  // 2. Save Settings
  const handleSave = async () => {
    setLoading(true);
    try {
      // ✅ Use the passed API_URL
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        alert("Settings Saved!");
        onClose();
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-black text-lg text-slate-700 dark:text-white">System Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">UPI ID (For QR Code)</label>
            <input 
              value={settings.upi_id} 
              onChange={e => setSettings({...settings, upi_id: e.target.value})} 
              className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="example@upi"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payee Name</label>
            <input 
              value={settings.payee_name} 
              onChange={e => setSettings({...settings, payee_name: e.target.value})} 
              className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Merchant Name"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button onClick={onClose} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}