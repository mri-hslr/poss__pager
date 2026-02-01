import React from "react";
// ✅ FIX: Removed 'BellCheck'. Added 'Check'.
import { X, Check } from "lucide-react";

export default function ActiveOrdersDrawer({
  isOpen,
  onClose,
  orders = [],
  onCompleteOrder,
  isDarkMode
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] p-6 
        ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            🍳 Kitchen
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <p className="opacity-50 text-center mt-20">
            No active orders
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className={`p-4 rounded-xl border 
                ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-orange-500">
                    #{order.token}
                  </span>
                  <span className="text-xs opacity-60">
                    {new Date(order.created_at || Date.now()).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-sm space-y-1 mb-4">
                  {order.items.map((i, idx) => (
                    <div key={i.id || idx}>
                      {i.name} × {i.quantity}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                    onClick={() => alert(`Calling token ${order.token}`)}
                  >
                    Call
                  </button>

                  <button
                    className="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
                    onClick={() => onCompleteOrder(order.id)}
                  >
                    {/* ✅ FIX: Using 'Check' icon which definitely exists */}
                    <Check size={18} />
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}