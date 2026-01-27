import React, { useState, useEffect } from 'react';
import { Save, X, CreditCard, User } from 'lucide-react';

export default function AdminSettingsModal({ open, onClose }) {
  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("auth_token");

  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Load current settings when modal opens
  useEffect(() => {
    if (open) {
      setMessage(null);
      fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.upi_id) {
          setUpiId(data.upi_id);
          setPayeeName(data.payee_name);
        }
      })
      .catch(err => console.error("Failed to load settings"));
    }
  }, [open, token]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ upi_id: upiId, payee_name: payeeName })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Settings Updated Successfully!' });
        setTimeout(() => {
           onClose(); 
           window.location.reload(); // Reload to refresh the main UI context
        }, 1000);
      } else {
        setMessage({ type: 'error', text: '❌ Update Failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Network Error' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-blue-400" />
            Payment Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {message && (
            <div className={`p-3 rounded-lg text-sm font-bold text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Merchant UPI ID (VPA)</label>
            <div className="flex items-center border-2 border-slate-200 rounded-xl px-3 py-3 focus-within:border-blue-500 transition-colors">
              <CreditCard size={18} className="text-slate-400 mr-3" />
              <input 
                type="text" 
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. merchant@okaxis"
                className="w-full outline-none font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Payee Name (Business Name)</label>
            <div className="flex items-center border-2 border-slate-200 rounded-xl px-3 py-3 focus-within:border-blue-500 transition-colors">
              <User size={18} className="text-slate-400 mr-3" />
              <input 
                type="text" 
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. My Restaurant"
                className="w-full outline-none font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 leading-relaxed">
            ℹ️ <strong>Note:</strong> Changing these details will instantly update the QR code generated for all future orders.
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
          >
            {loading ? 'Saving...' : <><Save size={18} /> Update Settings</>}
          </button>

        </div>
      </div>
    </div>
  );
}