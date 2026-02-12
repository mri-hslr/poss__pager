import React from 'react';
import { X, ChefHat, Check, BellRing } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function ActiveOrdersDrawer({ 
  isOpen, onClose, orders = [], onCompleteOrder, onCallCustomer, isDarkMode 
}) {
  React.useEffect(() => {
    if (isOpen) {
      console.log("Kitchen Drawer Data:", orders);
    }
  },[isOpen, orders]);
  if (!isOpen) return null;
  const theme = getTheme(isDarkMode);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200" style={{ fontFamily: FONTS.sans }}>
      <div className={`absolute inset-0 ${theme.bg.overlay}`} onClick={onClose} />
      <div 
        className={`relative w-full sm:w-[400px] h-full flex flex-col ${theme.bg.card} border-l ${theme.border.default}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 flex justify-between items-center ${theme.border.default} border-b`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme.bg.subtle}`}>
              <ChefHat size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-xl tracking-tight">Kitchen Queue</h2>
              <p className={`text-xs font-medium uppercase tracking-wider ${theme.text.tertiary}`}>
                Total: {orders.length}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full ${theme.button.ghost}`}>
            <X size={20} />
          </button>
        </div>
        
        {/* Orders List */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${theme.bg.main}`}>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
              <ChefHat size={64} className={theme.text.muted} />
              <p className={`font-medium ${theme.text.secondary}`}>No active orders</p>
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id} 
                className={`rounded-2xl p-6 border flex flex-col items-center transition-all ${COMMON_STYLES.card(isDarkMode)} ${theme.border.default}`}
              >
                {/* Time Created */}
                <div className={`mb-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold ${theme.border.default} ${theme.bg.subtle} ${theme.text.tertiary}`}>
                  {new Date(order.startedAt || order.created_at || Date.now()).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>

                {/* THE TOKEN NUMBER - Using order.token directly from backend */}
                <div className="flex flex-col items-center my-4">
                  <span className={`text-xs font-bold uppercase tracking-[0.2em] mb-1 ${theme.text.tertiary}`}>
                    Token
                  </span>
                  <span className={`text-6xl font-black ${theme.text.main}`}>
                    {order.token} 
                  </span>
                </div>
                
                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  <button 
                    onClick={() => onCallCustomer?.(order.token)} 
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] ${theme.button.ghost}`}
                  >
                    <BellRing size={16} /> Call
                  </button>
                  <button 
                    onClick={() => onCompleteOrder(order.id)} 
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] ${theme.button.primary}`}
                  >
                    <Check size={16} strokeWidth={3} /> Done
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}