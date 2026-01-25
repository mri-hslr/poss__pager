import React from 'react';
import { X, ChefHat, Check, Clock } from 'lucide-react';
import OrderTimer from './OrderTimer';

export default function ActiveOrdersDrawer({ isOpen, onClose, orders, onCompleteOrder, isDarkMode }) {
  if (!isOpen) return null;

  const theme = {
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white',
    textMain: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    textSec: isDarkMode ? 'text-slate-400' : 'text-stone-500',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
    accent: isDarkMode ? 'bg-blue-600' : 'bg-stone-900',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${theme.bgCard} ${theme.textMain} w-full md:w-full md:max-w-md h-full shadow-2xl flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
          <h2 className="font-bold text-lg flex items-center gap-2"><ChefHat className="text-orange-500" /> Active Orders</h2>
          <button onClick={onClose} className={`p-2 hover:bg-gray-500/10 rounded-full`}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className={`border ${theme.border} ${theme.bgCard} rounded-xl shadow-sm overflow-hidden`}>
              <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-stone-50'} p-3 flex justify-between items-center border-b ${theme.border}`}>
                <div className="flex gap-2 items-center">
                  <span className={`font-bold ${theme.accent} text-white px-2 py-0.5 rounded text-sm`}>T-{o.token}</span>
                  <span className={`text-xs font-bold ${theme.textSec}`}>#{o.displayId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <OrderTimer startedAt={o.startedAt} />
                  <button onClick={() => onCompleteOrder(o.id)} className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded-full"><Check size={16} /></button>
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
          {orders.length === 0 && <div className={`text-center mt-10 ${theme.textSec}`}>No active orders.</div>}
        </div>
      </div>
    </div>
  );
}