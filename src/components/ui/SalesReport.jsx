import React, { useState, useMemo } from 'react';
import { Calendar, Download, TrendingUp, Banknote, Smartphone, Wallet, Receipt } from 'lucide-react';

export default function SalesReport({ orders = [], history = [], products = [], isDarkMode }) {
  
  const getLocalDate = () => {
    if (typeof window === 'undefined') return new Date().toISOString().split('T')[0];
    return new Date().toLocaleDateString('en-CA');
  };

  const [reportDate, setReportDate] = useState(getLocalDate());

  // --- 🧠 SMART DATA NORMALIZER ---
  const repairOrderData = (o) => {
    let amount = 0;
    
    // 1. Get Totals
    if (o.total) amount = Number(o.total);
    else if (o.total_amount) amount = Number(o.total_amount);
    else if (o.financials?.finalPayable) amount = Number(o.financials.finalPayable);
    
    let discount = Number(o.discount || o.financials?.discount || 0);
    let tax = Number(o.tax || o.financials?.taxAmount || 0);
    
    // 2. Failsafe for missing amounts
    if (amount === 0 && o.items && Array.isArray(o.items)) {
      const rawSubtotal = o.items.reduce((sum, item) => {
        let price = Number(item.price || 0);
        if (price === 0 && products.length > 0) {
          const menuProduct = products.find(p => p.id === item.productId || p.name === item.name);
          if (menuProduct) price = Number(menuProduct.price);
        }
        return sum + (price * Number(item.quantity || 1));
      }, 0);

      const afterDisc = Math.max(0, rawSubtotal - discount);
      if (tax === 0) tax = afterDisc * 0.05; 
      amount = Math.round(afterDisc + tax);
    }

    // 3. Fix Payment Method
    let method = 'unknown';
    if (o.paymentMethod) method = o.paymentMethod.toUpperCase();
    else if (o.payment_method) method = o.payment_method.toUpperCase();
    else if (o.payment?.method) method = o.payment.method.toUpperCase();
    
    if ((method === 'UNKNOWN' || !method) && amount > 0) method = 'CASH';

    const activeDate = o.completedAt || o.startedAt || o.created_at || new Date().toISOString();

    return { 
        ...o, 
        amount, 
        method, 
        discount, 
        tax, 
        activeDate,
        status: o.status || "COMPLETED" 
    };
  };

  const allOrders = [...orders, ...history];
  
  const filteredOrders = allOrders
    .map(repairOrderData)
    .filter(o => {
      if (!o.activeDate) return false;
      const d = new Date(o.activeDate);
      return !isNaN(d.getTime()) && d.toLocaleDateString('en-CA') === reportDate;
    })
    .sort((a, b) => new Date(b.activeDate) - new Date(a.activeDate));

  // --- CALCULATIONS ---
  const chartData = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredOrders.forEach(o => { 
        const h = new Date(o.activeDate).getHours();
        hours[h] += o.amount; 
    });
    return hours;
  }, [filteredOrders]);

  const maxSales = Math.max(...chartData, 100);
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalTax = filteredOrders.reduce((sum, o) => sum + o.tax, 0);
  
  const totalCash = filteredOrders.filter(o => o.method === 'CASH').reduce((sum, o) => sum + o.amount, 0);
  const totalDigital = filteredOrders.filter(o => o.method !== 'CASH').reduce((sum, o) => sum + o.amount, 0);

  const exportData = () => {
    if (filteredOrders.length === 0) { alert("No data"); return; }
    const headers = ["ID", "Time", "Items", "Subtotal", "Discount", "Tax", "Total", "Method"];
    const rows = filteredOrders.map(o => [
        o.id, 
        new Date(o.activeDate).toLocaleTimeString(), 
        `"${o.items?.map(i => `${i.name}(${i.quantity})`).join('|') || ''}"`, 
        (o.amount - o.tax + o.discount).toFixed(2), 
        o.discount,
        o.tax,
        o.amount, 
        o.method
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Sales_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const theme = {
    bgCard: isDarkMode ? 'bg-black border-[#333]' : 'bg-white border-gray-200',
    textMain: isDarkMode ? 'text-white' : 'text-black',
    textSec: isDarkMode ? 'text-[#888]' : 'text-gray-600',
    rowClass: isDarkMode 
        ? 'border-[#333] text-white hover:bg-white/5' 
        : 'border-gray-200 text-black hover:bg-gray-50',     
  };

  return (
    <div className={`flex flex-col h-full font-['Geist',_sans-serif] antialiased animate-in fade-in zoom-in-95 duration-300`}>
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
                <h1 className={`text-2xl font-semibold ${theme.textMain}`}>Dashboard</h1>
                <p className={`text-sm font-medium ${theme.textSec}`}>Overview for {reportDate}</p>
            </div>
            
            <div className="flex gap-3">
                <div className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.bgCard} ${theme.textMain}`}>
                    <Calendar size={18} className={theme.textSec}/>
                    <span className="font-medium text-sm">{reportDate}</span>
                    <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
                <button onClick={exportData} className={`px-4 py-2 rounded-lg border ${theme.bgCard} ${theme.textMain} flex items-center gap-2 hover:border-white/20 transition-all active:scale-[0.98]`}>
                    <Download size={18}/> <span className="font-medium text-sm">Export CSV</span>
                </button>
            </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 shrink-0">
            <div className={`p-5 rounded-xl border ${theme.bgCard}`}>
                <div className={`flex items-center gap-2 mb-2 ${theme.textSec}`}><Wallet size={16}/><span className="text-xs font-medium uppercase">Revenue</span></div>
                <div className={`text-2xl font-semibold ${theme.textMain}`}>₹{totalRevenue}</div>
            </div>
            <div className={`p-5 rounded-xl border ${theme.bgCard}`}>
                <div className={`flex items-center gap-2 mb-2 ${theme.textSec}`}><Receipt size={16}/><span className="text-xs font-medium uppercase">Tax</span></div>
                <div className={`text-2xl font-semibold ${theme.textMain}`}>₹{Math.round(totalTax)}</div>
            </div>
            <div className={`p-5 rounded-xl border ${theme.bgCard}`}>
                <div className={`flex items-center gap-2 mb-2 ${theme.textSec}`}><Smartphone size={16}/><span className="text-xs font-medium uppercase">Digital</span></div>
                <div className={`text-2xl font-semibold ${theme.textMain}`}>₹{totalDigital}</div>
            </div>
            <div className={`p-5 rounded-xl border ${theme.bgCard}`}>
                <div className={`flex items-center gap-2 mb-2 ${theme.textSec}`}><Banknote size={16}/><span className="text-xs font-medium uppercase">Cash</span></div>
                <div className={`text-2xl font-semibold ${theme.textMain}`}>₹{totalCash}</div>
            </div>
            <div className={`p-5 rounded-xl border ${theme.bgCard}`}>
                <div className={`flex items-center gap-2 mb-2 ${theme.textSec}`}><TrendingUp size={16}/><span className="text-xs font-medium uppercase">Orders</span></div>
                <div className={`text-2xl font-semibold ${theme.textMain}`}>{filteredOrders.length}</div>
            </div>
        </div>

        {/* GRAPH */}
        <div className={`mb-6 rounded-xl border ${theme.bgCard} p-6 shrink-0`}>
            <div className="flex items-center gap-2 mb-6"><TrendingUp size={20} className={theme.textSec}/><h2 className={`font-semibold ${theme.textMain}`}>Hourly Activity</h2></div>
            <div className="custom-scrollbar overflow-x-auto pb-2">
                <div className="h-40 flex gap-3 items-end min-w-[600px] md:min-w-0">
                    {chartData.map((val, h) => (
                        <div key={h} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            {val > 0 && <div className={`absolute bottom-full mb-2 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} text-xs py-1 px-2 rounded font-medium z-10`}>₹{val}</div>}
                            <div className={`w-full rounded-t-lg transition-all duration-500 ${val > 0 ? (isDarkMode ? 'bg-white' : 'bg-black') : (isDarkMode ? 'bg-white/10' : 'bg-gray-200')}`} style={{height: `${(val / maxSales) * 100}%`, minHeight: '4px'}}></div>
                            <span className={`text-[10px] font-medium ${theme.textSec} mt-2`}>{h}:00</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* HISTORY */}
        <div className={`flex-1 overflow-hidden rounded-xl border ${theme.bgCard} flex flex-col`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-200'} font-semibold flex items-center gap-2 ${theme.textMain}`}>
                <Banknote size={20} className={theme.textSec}/> Transaction History
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className={`${theme.textSec} text-xs uppercase sticky top-0 ${isDarkMode ? 'bg-black' : 'bg-white'} z-10`}>
                        <tr>
                            <th className="p-3 pl-4 font-medium">ID</th>
                            <th className="p-3 font-medium">Time</th>
                            <th className="p-3 font-medium">Method</th>
                            <th className="p-3 text-right font-medium">Disc</th>
                            <th className="p-3 text-right font-medium">Tax</th>
                            <th className="p-3 text-right pr-4 font-medium">Total</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-[#333]' : 'divide-gray-100'}`}>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="6" className={`p-8 text-center font-medium ${theme.textSec}`}>No transactions today.</td></tr>
                        ) : (
                            filteredOrders.map(o => (
                                <tr key={o.id} className={`border-b transition-colors cursor-default ${theme.rowClass}`}>
                                    <td className="p-3 pl-4 font-mono font-medium opacity-70">#{String(o.id).slice(-4)}</td>
                                    <td className="p-3 font-medium">{new Date(o.activeDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${o.method === 'CASH' ? 'bg-white/10 text-white border border-white/10' : 'bg-white/10 text-white border border-white/10'}`}>
                                            {o.method}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-[#888]">{o.discount > 0 ? `-${o.discount}` : '-'}</td>
                                    <td className="p-3 text-right text-[#888]">{o.tax > 0 ? o.tax : '-'}</td>
                                    <td className="p-3 pr-4 text-right font-semibold">{o.amount}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}