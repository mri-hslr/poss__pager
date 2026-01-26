import React, { useState, useEffect, useRef } from 'react';
import { Banknote, CreditCard, QrCode } from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  onConfirm,
  cartSubtotal,
  taxAmount,
  discount,
  grandTotal,
  orderId,
  isDarkMode,
  upiId,
  payeeName
}) {
  if (!isOpen) return null;

  const [paymentMode, setPaymentMode] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const cashInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMode('CASH');
      setCashReceived('');
      setTimeout(() => cashInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const processingFee = paymentMode === 'CARD' ? Math.round(grandTotal * 0.02) : 0;
  const customerPayable = grandTotal + processingFee;

  const isUPIEnabled = Boolean(upiId && payeeName);

  const getUPIQR = () => {
    if (!isUPIEnabled) return null;
    const tempTr = `ORD${orderId}-${Date.now()}`;
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${customerPayable}&cu=INR&tn=Order%20${orderId}&tr=${tempTr}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  };

  const handleConfirm = () => {
    onConfirm({
      payment: {
        method: paymentMode,
        received: paymentMode === 'CASH' ? Number(cashReceived) : customerPayable
      },
      financials: {
        subtotal: cartSubtotal,
        tax: taxAmount,
        discount,
        processingFee,
        finalPayable: customerPayable
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-center bg-black/70">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="font-bold mb-4">Payment</h2>

        <div className="flex gap-2 mb-4">
          {['CASH', 'UPI', 'CARD'].map(mode => {
            const disabled = mode === 'UPI' && !isUPIEnabled;
            return (
              <button
                key={mode}
                disabled={disabled}
                onClick={() => setPaymentMode(mode)}
                className={`border px-3 py-2 rounded ${disabled ? 'opacity-40' : ''}`}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {paymentMode === 'UPI' && isUPIEnabled && (
          <div className="text-center">
            <img src={getUPIQR()} className="mx-auto w-40" />
            <p>{payeeName}</p>
          </div>
        )}

        <button onClick={handleConfirm} className="mt-4 bg-black text-white px-4 py-2 w-full">
          Confirm
        </button>
      </div>
    </div>
  );
}