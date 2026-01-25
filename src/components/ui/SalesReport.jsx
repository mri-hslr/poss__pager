import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Calendar, Download, TrendingUp, Banknote } from 'lucide-react';

export default function SalesReport({ orders, history, onBack, isDarkMode }) {
  // --- 1. SAFE DATE HELPER ---
  const getLocalDate = () => {
    if (typeof window === 'undefined') return new Date().toISOString().split('T')[0];
    return new Date().toLocaleDateString('en-CA');
  };

  const [reportDate, setReportDate] = useState(getLocalDate());
  const backBtnRef = useRef(null);

  useEffect(() => { setTimeout(() => backBtnRef.current?.focus(), 50); }, []);

  // --- 2. DATA FILTERING ---
  const allOrders = [...orders, ...history];
  const filteredOrders = allOrders.filter(o => {
    if (!o.startedAt) return false;
    const d = new Date(o.startedAt);
    return !isNaN(d.getTime()) && d.toLocaleDateString('en-CA') === reportDate;
  }).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));

  // --- 3. NAN-PROOF CALCULATIONS ---
  const chartData = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredOrders.forEach(o => { 
        const h = new Date(o.startedAt).getHours();
        hours[h] += Number(o.total || 0); 
    });
    return hours;
  }, [filteredOrders]);

  const maxSales = Math.max(...chartData, 1);
  
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalFees = filteredOrders.reduce((sum, o) => sum + (Number(o.financials?.processingFee) || 0), 0);
  
  const totalCash = filteredOrders.filter(o => o.payment?.method === 'CASH').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalUPI = filteredOrders.filter(o => o.payment?.method === 'UPI').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalCard = filteredOrders.filter(o => o.payment?.method === 'CARD').reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // --- 4. CSV EXPORT ---
  const exportData = () => {
    if (filteredOrders.length === 0) { alert("No data"); return; }
    const headers = ["Order ID", "Time", "Items", "Subtotal", "Discount", "Tax", "Fee", "Total", "Method", "Status"];
    const rows = filteredOrders.map(o => [
        o.displayId, 
        new Date(o.startedAt).toLocaleTimeString(), 
        `"${o.items?.map(i => `${i.name}(${i.quantity})`).join('|') || ''}"`, 
        Number(o.financials?.subtotal || 0), 
        Number(o.financials?.discount || 0), 
        Number(o.financials?.tax || 0), 
        Number(o.financials?.processingFee || 0), 
        Number(o.total || 0), 
        o.payment?.method || 'N/A',
        orders.find(active => active.id === o.id) ? "ACTIVE" : "COMPLETED"
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Sales_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReportNav = (e, type) => {
    if (e.key === 'Backspace') onBack();
  };

  const theme = {
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-stone-50',
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white',
    textMain: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    textSec: isDarkMode ? 'text-slate-400' : 'text-stone-500',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
    hover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-stone-100',
  };

  return (
    // FIX: Using fixed inset-0 ensures it covers the WHOLE screen, no white gaps
    <div className={`fixed inset-0 z-50 flex flex-col p-6 overflow-hidden font-sans transition-colors duration-200 ${theme.bgMain} ${theme.textMain}`}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-4">
                <button ref={backBtnRef} onKeyDown={(e) => handleReportNav(e, 'BACK')} onClick={onBack} className={`p-2 rounded-full border ${theme.border} ${theme.hover} outline-none focus:ring-2 focus:ring-blue-500`}>
                    <ArrowLeft size={24}/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Sales Report</h1>
                    <p className={`text-sm ${theme.textSec}`}>Summary for {reportDate}</p>
                </div>
            </div>
            
            <div className="flex gap-2">
                {/* FIX: CALENDAR BUTTON - Input is invisible but covers the whole button */}
                <div className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.border} ${theme.bgCard} cursor-pointer hover:border-blue-500 transition-colors`}>
                    <Calendar size={18} className={theme.textSec}/>
                    <span className="font-bold text-sm">{reportDate}</span>
                    <input 
                        type="date" 
                        value={reportDate} 
                        onChange={(e) => setReportDate(e.target.value)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        // Opacity 0 makes it invisible but clickable everywhere
                    />
                </div>

                <button onClick={exportData} className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.bgCard} flex items-center gap-2 hover:border-blue-500 active:scale-95 transition-all`}>
                    <Download size={18}/> 
                    <span className="font-bold text-sm">Export</span>
                </button>
            </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
            <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgCard}`}>
                <div className={`text-sm ${theme.textSec}`}>Total Revenue</div>
                <div className="text-3xl font-bold mt-1">₹{totalRevenue}</div>
            </div>
            <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgCard}`}>
                <div className={`text-sm ${theme.textSec}`}>Total Orders</div>
                <div className="text-3xl font-bold mt-1">{filteredOrders.length}</div>
            </div>
            <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgCard}`}>
                <div className={`text-sm ${theme.textSec}`}>Fees Collected</div>
                <div className="text-3xl font-bold mt-1 text-orange-500">₹{totalFees}</div>
            </div>
            <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgCard}`}>
                <div className={`text-sm ${theme.textSec}`}>Cash / Digital</div>
                <div className="flex gap-2 mt-2 font-bold text-xs">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">C: {totalCash}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">D: {totalUPI + totalCard}</span>
                </div>
            </div>
        </div>

        {/* GRAPH */}
        <div className={`mb-6 rounded-xl border ${theme.border} ${theme.bgCard} p-4 shrink-0`}>
            <div className="flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-blue-500"/><h2 className="font-bold text-sm">Hourly Sales</h2></div>
            <div className="custom-scrollbar overflow-x-auto pb-2 touch-auto">
                <div className="h-32 flex gap-2 items-end min-w-[600px] md:min-w-0">
                    {chartData.map((val, h) => (
                        <div key={h} className="flex-1 flex flex-col justify-end items-center group relative h-full cursor-pointer">
                            <div className="absolute bottom-full mb-2 hidden group-hover:flex bg-slate-800 text-white text-xs p-1 rounded font-bold z-10">₹{val}</div>
                            <div className={`w-full rounded-t-sm transition-all duration-500 ${val > 0 ? 'bg-blue-500' : 'bg-stone-200 dark:bg-slate-800'}`} style={{height: `${(val / maxSales) * 100}%`, minHeight: '2px'}}></div>
                            <span className={`text-[10px] ${theme.textSec} mt-1`}>{h}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* TRANSACTION HISTORY TABLE */}
        <div className={`flex-1 overflow-hidden rounded-xl border ${theme.border} ${theme.bgCard} flex flex-col`}>
            <div className={`p-3 border-b ${theme.border} font-bold flex items-center gap-2 bg-opacity-50 ${isDarkMode ? 'bg-slate-800' : 'bg-stone-50'}`}>
                <Banknote size={18}/> History
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`${theme.textSec} border-b ${theme.border} sticky top-0 ${theme.bgCard}`}>
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Time</th>
                            <th className="p-3">Total</th>
                            <th className="p-3 text-green-500">Disc</th>
                            <th className="p-3 text-orange-500">Fee</th>
                            <th className="p-3">Method</th>
                            <th className="p-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="7" className={`p-8 text-center ${theme.textSec}`}>No orders found for this date.</td></tr>
                        ) : (
                            filteredOrders.map(o => (
                                <tr key={o.id} className={theme.hover}>
                                    <td className="p-3 font-mono font-bold">#{o.displayId}</td>
                                    <td className="p-3">{o.startedAt ? new Date(o.startedAt).toLocaleTimeString() : '-'}</td>
                                    <td className="p-3 font-bold">₹{Number(o.total || 0)}</td>
                                    <td className="p-3 text-green-500 font-bold">{Number(o.financials?.discount || 0) > 0 ? `-₹${o.financials.discount}` : '-'}</td>
                                    <td className="p-3 text-orange-500 font-bold">{Number(o.financials?.processingFee || 0) > 0 ? `+₹${o.financials.processingFee}` : '-'}</td>
                                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${o.payment?.method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{o.payment?.method || 'N/A'}</span></td>
                                    <td className="p-3 text-right">{orders.find(a => a.id === o.id) ? <span className="text-orange-500 font-bold text-xs">ACTIVE</span> : <span className="text-stone-400 text-xs">DONE</span>}</td>
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