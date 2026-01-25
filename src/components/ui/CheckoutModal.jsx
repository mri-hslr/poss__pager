import React, { useState, useEffect, useRef } from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, onConfirm, cartSubtotal, taxAmount, discount, grandTotal, orderId, isDarkMode }) {
  if (!isOpen) return null;

  const [paymentMode, setPaymentMode] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const cashInputRef = useRef(null);

  const upiConfig = { pa: 'mridulbhardwaj13@okaxis', pn: 'Grid Sphere', cu: 'INR' };

  useEffect(() => {
    if (isOpen) {
        setPaymentMode('CASH');
        setCashReceived('');
        setTimeout(() => cashInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fee Logic: 2% ONLY on Card
  const processingFee = (paymentMode === 'CARD') ? Math.round(grandTotal * 0.02) : 0;
  const customerPayable = grandTotal + processingFee;

  const getUPIQR = () => {
    const tempTr = `ORD${orderId}-${Date.now()}`;
    const upiString = `upi://pay?pa=${upiConfig.pa}&pn=${encodeURIComponent(upiConfig.pn)}&am=${customerPayable}&cu=${upiConfig.cu}&tn=Order%20${orderId}&tr=${tempTr}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  };

  const handleConfirm = () => {
    onConfirm({
        payment: { method: paymentMode, received: paymentMode === 'CASH' ? Number(cashReceived) : customerPayable },
        financials: { subtotal: cartSubtotal, tax: taxAmount, discount, processingFee, finalPayable: customerPayable }
    });
  };

  const theme = {
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white',
    textMain: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-stone-100',
    accent: isDarkMode ? 'bg-blue-600' : 'bg-stone-900',
    accentText: 'text-white'
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative ${theme.bgCard} w-full md:max-w-md h-[90vh] md:h-auto rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col`}>
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-stone-900'} text-white p-6 flex justify-between items-center shrink-0`}>
                <div>
                    <div className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">Customer Pays</div>
                    <div className="text-4xl font-bold">₹{customerPayable}</div>
                    {processingFee > 0 && <div className="text-xs text-orange-300 mt-1">Includes ₹{processingFee} fee</div>}
                </div>
                <div className="text-right">
                    <div className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">You Receive</div>
                    <div className="text-xl font-bold">₹{grandTotal}</div>
                    <div className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono mt-2 inline-block">Order #{String(orderId).padStart(3, '0')}</div>
                </div>
            </div>
            <div className={`p-6 space-y-6 overflow-y-auto flex-1 ${theme.textMain}`}>
                <div className="grid grid-cols-3 gap-3">
                    {['CASH', 'UPI', 'CARD'].map(mode => (
                        <button key={mode} onClick={() => setPaymentMode(mode)} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${paymentMode === mode ? 'border-blue-600 bg-blue-50/10 text-blue-500' : `${theme.border} ${theme.bgCard} hover:border-stone-400`}`}>
                            {mode === 'CASH' && <Banknote size={24} />}
                            {mode === 'UPI' && <QrCode size={24} />}
                            {mode === 'CARD' && <CreditCard size={24} />}
                            <span className="font-bold text-xs tracking-wider">{mode}</span>
                        </button>
                    ))}
                </div>
                {paymentMode === 'CASH' ? (
                    <div className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-stone-50'} rounded-2xl p-4 border ${theme.border} space-y-4`}>
                        <div><label className="block text-xs font-bold text-stone-400 uppercase mb-1">Cash Received</label><input ref={cashInputRef} type="number" min="0" value={cashReceived} onChange={(e) => { if(Number(e.target.value) >= 0) setCashReceived(e.target.value); }} className={`w-full pl-8 pr-4 py-3 text-2xl font-bold ${theme.bgCard} ${theme.textMain} ${theme.border} border rounded-xl focus:ring-4 focus:ring-blue-500 outline-none`} placeholder="0"/></div>
                        <div className={`flex justify-between items-center pt-2 border-t border-dashed ${theme.border}`}><span className="opacity-60">Change</span><span className={`text-2xl font-bold ${(Number(cashReceived) - customerPayable) < 0 ? 'text-stone-500' : 'text-green-500'}`}>₹{Math.max(0, Number(cashReceived) - customerPayable)}</span></div>
                    </div>
                ) : (
                    <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 flex flex-col items-center text-center gap-2">
                         {paymentMode === 'UPI' ? <><div className="bg-white p-3 rounded-lg shadow-sm"><img src={getUPIQR()} alt="UPI QR" className="w-40 h-40 object-contain"/></div><div className="text-blue-500 font-medium text-sm mt-2">Scan to Pay ₹{customerPayable}</div></> : <><CreditCard size={48} className="text-blue-400"/><div className="text-blue-500 font-medium">Use Card Machine</div></>}
                    </div>
                )}
                <button onClick={handleConfirm} disabled={paymentMode === 'CASH' && Number(cashReceived) < customerPayable} className={`w-full py-4 ${theme.accent} ${theme.accentText} rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-xl`}>Confirm Payment</button>
            </div>
        </div>
    </div>
  );
}