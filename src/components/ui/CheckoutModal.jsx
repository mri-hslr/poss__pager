import React, { useEffect, useRef, useState } from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';
import { getUPIQR } from './utils';
import { UPI_CONFIG } from './data';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalPayable, 
  grandTotal, 
  selectedToken, 
  orderId, 
  processingFee, 
  theme, 
  isDarkMode 
}) {
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const cashInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCashReceived('');
      // Slight delay to allow modal to render before focusing
      setTimeout(() => cashInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleFinalize = () => {
    onConfirm({
      method: paymentMode,
      received: paymentMode === 'CASH' ? Number(cashReceived) : totalPayable,
      change: paymentMode === 'CASH' ? Number(cashReceived) - totalPayable : 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${theme.bgCard} w-full md:max-w-md h-[90vh] md:h-auto rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-stone-900'} text-white p-6 flex justify-between items-center shrink-0`}>
          <div>
            <div className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">Customer Pays</div>
            <div className="text-4xl font-bold">₹{totalPayable}</div>
            {processingFee > 0 && <div className="text-xs text-orange-300 mt-1">Includes ₹{processingFee} fee</div>}
          </div>
          <div className="text-right">
            <div className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">You Receive</div>
            <div className="text-xl font-bold">₹{grandTotal}</div>
            <div className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono mt-2 inline-block">Order #{orderId}</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            {['CASH', 'UPI', 'CARD'].map(mode => (
              <button key={mode} onClick={() => setPaymentMode(mode)} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${paymentMode === mode ? 'border-blue-600 bg-blue-50/10 text-blue-500' : `${theme.border} ${theme.bgCard} ${theme.textSec} hover:border-stone-400`}`}>
                {mode === 'CASH' && <Banknote size={24} />}
                {mode === 'UPI' && <QrCode size={24} />}
                {mode === 'CARD' && <CreditCard size={24} />}
                <span className="font-bold text-xs tracking-wider">{mode}</span>
              </button>
            ))}
          </div>

          {paymentMode === 'CASH' ? (
            <div className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-stone-50'} rounded-2xl p-4 border ${theme.border} space-y-4`}>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Cash Received</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">₹</span>
                  <input ref={cashInputRef} type="number" min="0" value={cashReceived} onChange={(e) => { if(Number(e.target.value) >= 0) setCashReceived(e.target.value); }} className={`w-full pl-8 pr-4 py-3 text-2xl font-bold ${theme.bgCard} ${theme.textMain} ${theme.border} border rounded-xl focus:ring-4 focus:ring-blue-500 outline-none`} placeholder="0"/>
                </div>
              </div>
              <div className={`flex justify-between items-center pt-2 border-t border-dashed ${theme.border}`}>
                <span className={theme.textSec}>Change</span>
                <span className={`text-2xl font-bold ${(Number(cashReceived) - totalPayable) < 0 ? 'text-stone-500' : 'text-green-500'}`}>₹{Math.max(0, Number(cashReceived) - totalPayable)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 flex flex-col items-center text-center gap-2">
              {paymentMode === 'UPI' ? (
                <>
                  <div className="bg-white p-3 rounded-lg">
                    <img src={getUPIQR(UPI_CONFIG, totalPayable, selectedToken, orderId)} alt="UPI QR" className="w-48 h-48 object-contain"/>
                  </div>
                  <div className="text-blue-500 font-medium text-sm mt-2">Scan to Pay ₹{totalPayable}</div>
                </>
              ) : (
                <>
                  <CreditCard size={48} className="text-blue-400"/>
                  <div className="text-blue-500 font-medium">Use Card Machine</div>
                  <div className="text-blue-400 text-xs">Charge ₹{totalPayable} on device</div>
                </>
              )}
            </div>
          )}

          <button onClick={handleFinalize} disabled={paymentMode === 'CASH' && Number(cashReceived) < totalPayable} className={`w-full py-4 ${theme.accent} ${theme.accentText} rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-xl`}>
            {paymentMode === 'CASH' ? (Number(cashReceived) < totalPayable ? 'Enter Full Amount' : `Accept Payment`) : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}