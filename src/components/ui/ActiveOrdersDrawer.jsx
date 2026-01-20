import React from 'react';
import { X, ChefHat, Check } from 'lucide-react';
import OrderTimer from './OrderTimer';

export default function ActiveOrdersDrawer({ 
  isOpen, 
  onClose, 
  orders, 
  onCompleteOrder, 
  theme, 
  isDarkMode 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${theme.bgCard} w-full md:w-full md:max-w-md h-full shadow-2xl flex flex-col`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ChefHat className="text-orange-500" /> Active Orders
          </h2>
          <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-full`}>
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orders.length === 0 && (
            <div className={`text-center mt-10 ${theme.textSec}`}>No active orders.</div>
          )}
          
          {orders.map((o) => (
            <div key={o.id} className={`border ${theme.border} ${theme.bgCard} rounded-xl shadow-sm overflow-hidden`}>
              <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-stone-50'} p-3 flex justify-between items-center border-b ${theme.border}`}>
                <div className="flex gap-2 items-center">
                  <span className={`font-bold ${theme.accent} text-white px-2 py-0.5 rounded text-sm`}>
                    T-{o.token}
                  </span>
                  <span className={`text-xs font-bold ${theme.textSec}`}>#{o.displayId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <OrderTimer startedAt={o.startedAt} />
                  <button onClick={() => onCompleteOrder(o.id)} className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded-full">
                    <Check size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                {o.items.map((i) => (
                  <div key={i.id} className={`flex justify-between text-sm py-1 border-b border-dashed last:border-0 ${theme.border}`}>
                    <span>{i.name} <span className="text-stone-400 text-xs">x{i.quantity}</span></span>
                  </div>
                ))}
                <div className="text-right font-bold mt-2">₹{o.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}