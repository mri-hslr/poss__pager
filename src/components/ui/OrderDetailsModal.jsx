import React, { useEffect, useRef } from 'react';
import { X, Clock, Check } from 'lucide-react';
import OrderTimer from './OrderTimer';

export default function OrderDetailsModal({ 
  order, 
  onClose, 
  onComplete, 
  theme 
}) {
  const releaseBtnRef = useRef(null);

  useEffect(() => {
    setTimeout(() => releaseBtnRef.current?.focus(), 50);
  }, []);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${theme.bgCard} w-full md:max-w-sm h-[80vh] md:h-auto rounded-t-3xl md:rounded-2xl shadow-2xl p-6 flex flex-col gap-4 mx-0 md:mx-4`}>
        
        {/* Header */}
        <div className={`flex justify-between items-start border-b ${theme.border} pb-4 shrink-0`}>
           <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">Token {order.token}</span>
                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">#{order.displayId}</span>
              </div>
              <div className={`${theme.textSec} text-sm mt-1 flex items-center gap-2`}>
                <Clock size={14} /> Preparing <OrderTimer startedAt={order.startedAt} />
              </div>
           </div>
           <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-full ${theme.textSec}`}>
             <X size={24} />
           </button>
        </div>

        {/* Items */}
        <div className="py-2 space-y-3 overflow-y-auto flex-1">
           {order.items.map((item) => (
             <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="font-bold">{item.name}</div>
                   <div className="text-stone-400 text-xs">x{item.quantity}</div>
                </div>
                <div className="font-mono">₹{item.price * item.quantity}</div>
             </div>
           ))}
           <div className={`border-t border-dashed ${theme.border} my-2`}></div>
           <div className="flex justify-between items-center text-lg font-bold">
             <span>Total Bill</span><span>₹{order.total}</span>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col gap-2 shrink-0">
           <button 
             ref={releaseBtnRef} 
             onClick={() => onComplete(order.id)} 
             className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
           >
             <Check size={20} /> Mark Ready
           </button>
           <button onClick={onClose} className={`w-full py-2 ${theme.textSec} hover:${theme.textMain} font-medium text-sm`}>
             Close Details
           </button>
        </div>
      </div>
    </div>
  );
}