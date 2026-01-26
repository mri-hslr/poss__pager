import React, { useState, useEffect, useRef } from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';

export default function CheckoutModal({
  isOpen, onClose, onConfirm, onSuccess,
  cartSubtotal, taxAmount, discount, grandTotal,
  backendUpiData // <--- Receive the QR data
}) {
  if (!isOpen) return null;

  const [paymentMode, setPaymentMode] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const cashInputRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMode('CASH');
      setCashReceived('');
      setLoading(false);
    }
  }, [isOpen]);

  const customerPayable = grandTotal;

  // Handle the "Confirm" click
  const handleConfirm = async () => {
    setLoading(true);
    const orderData = {
      paymentMethod: paymentMode,
      financials: { finalPayable: customerPayable }
    };
    // Call parent finalizeOrder, wait for it to set backendUpiData
    await onConfirm(orderData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/80 p-4 text-white">
      <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
            ✕
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-center">Payment</h2>

        {/* --- CRITICAL FIX: Direct check for QR Data --- */}
        {backendUpiData ? (
          <div className="flex flex-col items-center">
             <div className="bg-white p-4 rounded-xl mb-4">
                {/* Render Base64 Image directly */}
                <img 
                    src={backendUpiData.qr} 
                    alt="UPI QR Code" 
                    className="w-48 h-48" 
                />
             </div>
             <p className="text-sm font-bold">{backendUpiData.payee}</p>
             <p className="text-emerald-500 font-black text-2xl mt-2">₹{customerPayable}</p>
             
             <button 
               onClick={onSuccess}
               className="mt-6 w-full py-4 bg-emerald-500 rounded-xl font-bold hover:bg-emerald-400"
             >
               Payment Done
             </button>
          </div>
        ) : (
          /* Input Screen */
          <>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['CASH', 'UPI', 'CARD'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-3 rounded-xl border-2 text-xs font-bold ${
                    paymentMode === mode 
                      ? 'border-blue-600 bg-blue-600/10 text-white' 
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="min-h-[150px] flex flex-col items-center justify-center border-y border-slate-800/50 my-6">
              {paymentMode === 'CASH' && (
                <input
                  ref={cashInputRef}
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Cash Received"
                  className="bg-transparent text-4xl font-black text-center outline-none w-full text-white"
                />
              )}
              {paymentMode === 'UPI' && (
                <div className="text-center">
                    <QrCode size={48} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-slate-400 text-sm">Click Confirm to generate QR</p>
                </div>
              )}
               {paymentMode === 'CARD' && (
                <div className="text-center">
                    <CreditCard size={48} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400 text-sm">Swipe Card on Terminal</p>
                </div>
              )}
            </div>

            <button 
              disabled={loading}
              onClick={handleConfirm}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black shadow-lg"
            >
              {loading ? 'Generating...' : `Confirm ₹${customerPayable}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}