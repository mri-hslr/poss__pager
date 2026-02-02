import React, { useState, useMemo } from 'react';
import { Calendar, Download, TrendingUp, Banknote, Smartphone, Wallet, Receipt } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function SalesReport({ orders = [], history = [], products = [], isDarkMode }) {
  const theme = getTheme(isDarkMode);
  
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

  return (
    <div className={`flex flex-col h-full antialiased animate-in fade-in zoom-in-95 duration-300`} style={{ fontFamily: FONTS.sans }}>
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
                <h1 className={`text-2xl font-semibold ${theme.text.main}`}>Dashboard</h1>
                <p className={`text-sm ${theme.text.secondary}`}>Overview for {reportDate}</p>
            </div>
            
            <div className="flex gap-3">
                <div className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border ${COMMON_STYLES.card(isDarkMode)}`}>
                    <Calendar size={18} className={theme.text.secondary}/>
                    <span className={`text-sm ${theme.text.main}`}>{reportDate}</span>
                    <input 
                        type="date" 
                        value={reportDate} 
                        onChange={(e) => setReportDate(e.target.value)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <button 
                    onClick={exportData} 
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${theme.button.secondary}`}
                >
                    <Download size={18}/> <span className="text-sm">Export CSV</span>
                </button>
            </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 shrink-0">
            {[
                { icon: Wallet, label: 'Revenue', value: `₹${totalRevenue}` },
                { icon: Receipt, label: 'Tax', value: `₹${Math.round(totalTax)}` },
                { icon: Smartphone, label: 'Digital', value: `₹${totalDigital}` },
                { icon: Banknote, label: 'Cash', value: `₹${totalCash}` },
                { icon: TrendingUp, label: 'Orders', value: filteredOrders.length }
            ].map((metric, idx) => (
                <div key={idx} className={`p-5 rounded-xl border ${COMMON_STYLES.card(isDarkMode)}`}>
                    <div className={`flex items-center gap-2 mb-2 ${theme.text.secondary}`}>
                        <metric.icon size={16}/>
                        <span className="text-xs font-medium uppercase">{metric.label}</span>
                    </div>
                    <div className={`text-2xl font-semibold ${theme.text.main}`}>{metric.value}</div>
                </div>
            ))}
        </div>

        {/* GRAPH */}
        <div className={`mb-6 rounded-xl border p-6 shrink-0 ${COMMON_STYLES.card(isDarkMode)}`}>
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className={theme.text.secondary}/>
                <h2 className={`font-semibold ${theme.text.main}`}>Hourly Activity</h2>
            </div>
            <div className="overflow-x-auto pb-2">
                <div className="h-40 flex gap-3 items-end min-w-[600px] md:min-w-0">
                    {chartData.map((val, h) => (
                        <div key={h} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            {val > 0 && (
                                <div className={`absolute bottom-full mb-2 px-2 py-1 rounded text-xs z-10 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                    ₹{val}
                                </div>
                            )}
                            <div 
                                className={`w-full rounded-t transition-all duration-500 ${val > 0 ? (isDarkMode ? 'bg-white' : 'bg-black') : theme.bg.subtle}`} 
                                style={{height: `${(val / maxSales) * 100}%`, minHeight: '4px'}}
                            />
                            <span className={`text-[10px] ${theme.text.secondary} mt-2`}>{h}:00</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* HISTORY */}
        <div className={`flex-1 overflow-hidden rounded-xl border flex flex-col ${COMMON_STYLES.card(isDarkMode)}`}>
            <div className={`p-4 border-b font-semibold flex items-center gap-2 ${theme.border.default} ${theme.text.main}`}>
                <Banknote size={20} className={theme.text.secondary}/> Transaction History
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className={`text-xs uppercase sticky top-0 z-10 ${COMMON_STYLES.tableHeader(isDarkMode)} ${theme.bg.main}`}>
                        <tr>
                            <th className="p-3 pl-4 font-medium">ID</th>
                            <th className="p-3 font-medium">Time</th>
                            <th className="p-3 font-medium">Method</th>
                            <th className="p-3 text-right font-medium">Disc</th>
                            <th className="p-3 text-right font-medium">Tax</th>
                            <th className="p-3 text-right pr-4 font-medium">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={`p-8 text-center ${theme.text.secondary}`}>
                                    No transactions today.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(o => (
                                <tr key={o.id} className={`${COMMON_STYLES.tableRow(isDarkMode)}`}>
                                    <td className={`p-3 pl-4 font-mono text-xs ${theme.text.tertiary}`}>
                                        #{String(o.id).slice(-4)}
                                    </td>
                                    <td className="p-3">
                                        {new Date(o.activeDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="p-3">
                                        <span className={`${COMMON_STYLES.badge(isDarkMode)} uppercase`}>
                                            {o.method}
                                        </span>
                                    </td>
                                    <td className={`p-3 text-right ${theme.text.secondary}`}>
                                        {o.discount > 0 ? `-${o.discount}` : '-'}
                                    </td>
                                    <td className={`p-3 text-right ${theme.text.secondary}`}>
                                        {o.tax > 0 ? o.tax : '-'}
                                    </td>
                                    <td className="p-3 pr-4 text-right font-semibold">
                                        {o.amount}
                                    </td>
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