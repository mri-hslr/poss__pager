import React, { useState, useEffect } from "react";
import { Save, CreditCard, User } from "lucide-react";
import { getTheme, COMMON_STYLES } from "./theme";

export default function AdminSettingsModal({
  open,
  onClose,
  restaurantId,
  isDarkMode,
}) {
  // Use fallback if env variable is missing
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = getTheme(isDarkMode);

  // 1. Fetch Settings on Load
  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) return;

          // GET request to /settings
          const res = await fetch(`${API_URL}/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            // Database returns snake_case, so we read those keys
            setUpiId(data.upi_id || "");
            setPayeeName(data.payee_name || "");
          }
        } catch (e) {
          console.error("Fetch settings failed:", e);
        }
      };
      fetchSettings();
    }
  }, [open, API_URL]);

  // 2. Save Settings
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");

      // ✅ CRITICAL FIX: Method MUST be PUT to match router.put('/')
      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // ✅ CRITICAL FIX: Send camelCase keys to match backend controller
        body: JSON.stringify({
          upiId: upiId,
          payeeName: payeeName,
          restaurantId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save settings");
      }

      alert("Settings Saved!");
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={`w-full h-full font-sans ${theme.bg.main} ${theme.text.main}
  animate-in fade-in slide-in-from-bottom-4 duration-500`}
    >
      <div className="w-full h-full flex flex-col">
        {/* Page Header (like Dashboard) */}
        <div className={`p-5 border-b ${theme.border.default}`}>
          <h2 className="text-2xl font-semibold">System Settings</h2>
          <p className={`text-sm mt-1 ${theme.text.secondary}`}>
            Manage UPI & payee details
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6 items-start max-w-5xl">
            {/* Payee Name (LEFT) */}
            <div>
              <label
                className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}
              >
                Payee Name
              </label>
              <div className="relative">
                <User
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary}`}
                  size={18}
                />
                <input
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Business Name"
                  className={`w-full pl-10 pr-4 py-2 ${COMMON_STYLES.input(isDarkMode)}`}
                />
              </div>
              <p className={`text-[10px] mt-1 ${theme.text.muted}`}>
                The name customers see when scanning.
              </p>
            </div>

            {/* UPI ID (RIGHT) */}
            <div>
              <label
                className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}
              >
                UPI ID (VPA)
              </label>
              <div className="relative">
                <CreditCard
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary}`}
                  size={18}
                />
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="merchant@upi"
                  className={`w-full pl-10 pr-4 py-2 ${COMMON_STYLES.input(isDarkMode)}`}
                />
              </div>
              <p className={`text-[10px] mt-1 ${theme.text.muted}`}>
                Your UPI ID for generating QR codes.
              </p>
            </div>
            <div className="flex items-center pt-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`h-[42px] px-6 rounded-lg font-medium text-sm flex items-center gap-2 ${theme.button.primary}`}
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
