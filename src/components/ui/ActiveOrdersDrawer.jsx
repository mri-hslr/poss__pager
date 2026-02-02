import React from 'react';
import { X, ChefHat, Check, BellRing } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function ActiveOrdersDrawer({ 
  isOpen, onClose, orders = [], onCompleteOrder, onCallCustomer, isDarkMode 
}) {
  if (!isOpen) return null;
  const theme = getTheme(isDarkMode);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200" style={{ fontFamily: FONTS.sans }}>
      <div className={`absolute inset-0 ${theme.bg.overlay}`} onClick={onClose} />
      <div 
        className={`relative w-full sm:w-[450px] h-full flex flex-col ${theme.bg.card} border-l ${theme.border.default}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 flex justify-between items-center ${theme.border.default} border-b`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme.bg.subtle}`}>
              <ChefHat size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-xl tracking-tight">Kitchen</h2>
              <p className={`text-xs font-medium uppercase tracking-wider ${theme.text.tertiary}`}>
                Live Orders
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full ${theme.button.ghost}`}
          >
            <X size={20} />
          </button>
        </div>
        
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
                className={`rounded-xl p-5 border relative overflow-hidden ${COMMON_STYLES.card(isDarkMode)}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bg.main}`}></div>
                
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div className="flex flex-col">
                    <span className={`text-xs font-medium uppercase tracking-wider mb-1 ${theme.text.secondary}`}>
                      Token
                    </span>
                    <span className={`text-2xl font-semibold ${theme.text.main} px-3 py-0.5 rounded w-fit`}>
                      #{order.token}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border ${theme.border.default} ${theme.bg.subtle}`}>
                    <span className={`text-xs font-mono font-medium ${theme.text.secondary}`}>
                      {new Date(order.startedAt || order.created_at || Date.now()).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 pl-2 mb-6">
                  {order.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center text-sm border-b border-dashed pb-2 last:border-0 last:pb-0 ${theme.border.default}`}
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-xs ${COMMON_STYLES.badge(isDarkMode)}`}>
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-3 pl-2">
                  <button 
                    onClick={() => onCallCustomer ? onCallCustomer(order.token) : alert(`Calling ${order.token}`)} 
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium text-sm transition-all ${theme.button.secondary}`}
                  >
                    <BellRing size={18} /> Call
                  </button>
                  <button 
                    onClick={() => onCompleteOrder(order.id)} 
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${theme.button.primary}`}
                  >
                    <Check size={18} strokeWidth={3} /> Done
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