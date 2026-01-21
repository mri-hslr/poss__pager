import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Receipt, ArrowRight, QrCode, Smartphone } from 'lucide-react';

// --- CONFIGURATION ---
// ✅ Updated based on your request
const MERCHANT_UPI_ID = "mridulbhardwaj13@okaxis"; 
const MERCHANT_NAME = "Grid Sphere"; 

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalPayable, 
  orderId, 
  theme = {}, 
  isDarkMode = false 
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'card', 'upi'
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const TRANSACTION_FEE_RATE = 0.02; // 2% for Cards
  const CURRENCY_SYMBOL = '₹';

  // --- DYNAMIC UPI QR GENERATION ---
  // 1. Define all variables
  const pa = MERCHANT_UPI_ID; // Payee Address
  const pn = MERCHANT_NAME; // Payee Name
  const am = totalPayable.toFixed(2); // Amount (Fixed to 2 decimals)
  const cu = "INR"; // Currency
  const tn = `Order ${orderId}`; // Transaction Note (User sees this)
  const tr = `ORD${orderId}`; // Transaction Ref (Backend ID)

  // 2. Construct the deep link string
  const upiDeepLink = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=${cu}&tn=${encodeURIComponent(tn)}&tr=${encodeURIComponent(tr)}`;

  // 3. Convert deep link to QR Code Image URL
  // We double-encode the UPI link because it is being passed as a parameter 'data' to the QR server
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiDeepLink)}`;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setAmountPaid('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- CALCULATIONS ---
  const processingFee = paymentMethod === 'card' ? totalPayable * TRANSACTION_FEE_RATE : 0;
  const netRevenue = totalPayable - processingFee;
  const changeDue = paymentMethod === 'cash' && amountPaid 
    ? Math.max(0, parseFloat(amountPaid) - totalPayable) 
    : 0;

  // --- HANDLERS ---
  const handleConfirm = () => {
    setIsProcessing(true);
    // Simulate network delay
    setTimeout(() => {
      onConfirm({
        method: paymentMethod,
        paidAmount: parseFloat(amountPaid) || totalPayable,
        change: changeDue,
        fee: processingFee,
        netRevenue: netRevenue,
        transactionRef: tr // Save the ref so you can find it later
      });
      setIsProcessing(false);
    }, 1500);
  };

  // Safe Theme Fallbacks
  const bgCard = theme.bgCard || (isDarkMode ? 'bg-slate-900' : 'bg-white');
  const textMain = theme.textMain || (isDarkMode ? 'text-white' : 'text-gray-900');
  const textSec = theme.textSec || (isDarkMode ? 'text-gray-400' : 'text-gray-500');
  const border = theme.border || (isDarkMode ? 'border-gray-700' : 'border-gray-200');
  const inputBg = theme.inputBg || (isDarkMode ? 'bg-slate-800' : 'bg-gray-50');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`${bgCard} w-full max-w-lg rounded-2xl shadow-2xl border ${border} flex flex-col overflow-hidden`}>
        
        {/* HEADER */}
        <div className={`p-6 border-b ${border} flex justify-between items-center`}>
          <div>
            <h2 className={`text-xl font-bold ${textMain} flex items-center gap-2`}>
              <Receipt className="w-5 h-5 text-blue-500" />
              Checkout Order #{orderId}
            </h2>
            <p className={`text-sm ${textSec}`}>Select payment method</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors`}>
            <X size={24} className={textSec} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          
          {/* TOTAL DISPLAY */}
          <div className="text-center py-4">
            <p className={`text-sm font-medium ${textSec} uppercase tracking-wider`}>Total Payable</p>
            <h1 className={`text-4xl font-extrabold ${textMain} mt-1`}>
              {CURRENCY_SYMBOL}{totalPayable.toFixed(2)}
            </h1>
          </div>

          {/* PAYMENT METHOD TOGGLE */}
          <div className={`grid grid-cols-3 gap-2 p-1 rounded-xl ${inputBg}`}>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                paymentMethod === 'cash' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : `${textSec} hover:bg-black/5`
              }`}
            >
              <Banknote size={18} /> Cash
            </button>
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                paymentMethod === 'upi' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : `${textSec} hover:bg-black/5`
              }`}
            >
              <QrCode size={18} /> UPI
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                paymentMethod === 'card' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : `${textSec} hover:bg-black/5`
              }`}
            >
              <CreditCard size={18} /> Card
            </button>
          </div>

          {/* DYNAMIC INPUTS AREA */}
          <div className={`p-4 rounded-xl border ${border} ${inputBg} min-h-[220px] flex flex-col justify-center`}>
            
            {/* 1. CASH VIEW */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4 w-full">
                <div>
                  <label className={`block text-xs font-bold ${textSec} uppercase mb-2`}>Amount Received</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${textSec}`}>{CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      autoFocus
                      placeholder={totalPayable.toFixed(2)}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className={`w-full pl-8 p-3 rounded-lg border ${border} ${bgCard} ${textMain} font-bold outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>
                </div>
                {parseFloat(amountPaid) >= totalPayable && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className={`font-medium ${textSec}`}>Change Due:</span>
                    <span className="text-green-600 font-bold text-xl">{CURRENCY_SYMBOL}{changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. UPI VIEW (Dynamic QR) */}
            {paymentMethod === 'upi' && (
              <div className="text-center space-y-3 w-full animate-in fade-in slide-in-from-bottom-2">
                <div className="mx-auto w-40 h-40 bg-white p-2 rounded-lg border border-gray-200 shadow-sm relative group">
                  {/* The Dynamic QR Code */}
                  <img 
                    src={qrCodeUrl} 
                    alt="UPI QR" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="space-y-1">
                  <p className={`text-sm ${textSec} flex items-center justify-center gap-2`}>
                    <Smartphone size={16} /> Scan to Pay <b>{CURRENCY_SYMBOL}{totalPayable.toFixed(2)}</b>
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Ref: {tr} | To: {pn}
                  </p>
                </div>

                <div className="flex justify-center gap-2 opacity-70 pt-2">
                   <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-[10px] font-bold">GPay</span>
                   <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-[10px] font-bold">PhonePe</span>
                   <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-[10px] font-bold">Paytm</span>
                </div>
              </div>
            )}

            {/* 3. CARD VIEW */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 w-full animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${textSec}`}>Transaction Fee (2%)</span>
                  <span className="text-red-500 font-bold">-{CURRENCY_SYMBOL}{processingFee.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between items-center pt-3 border-t ${border}`}>
                  <span className={`font-bold ${textMain}`}>Net Revenue</span>
                  <span className={`font-bold ${textMain}`}>{CURRENCY_SYMBOL}{netRevenue.toFixed(2)}</span>
                </div>
                <p className="text-xs text-blue-500 mt-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded border border-blue-100 dark:border-blue-800">
                  Fee is deducted from merchant revenue. Customer pays full amount.
                </p>
              </div>
            )}
          </div>

          {/* CONFIRM BUTTON */}
          <button
            onClick={handleConfirm}
            disabled={paymentMethod === 'cash' && parseFloat(amountPaid || 0) < totalPayable}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
              paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700 text-white' :
              paymentMethod === 'upi' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
              'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? 'Processing...' : (
              <>
                {paymentMethod === 'upi' ? 'Confirm Payment Received' : 'Confirm Payment'} <ArrowRight size={20} />
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}