import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Download, TrendingUp, Banknote } from 'lucide-react';
import { getLocalDate } from './utils';

export default function SalesReport({ 
  orders = [], 
  history = [], 
  onBack, 
  theme, 
  isDarkMode 
}) {
  const [reportDate, setReportDate] = useState(getLocalDate());
  const dateInputRef = useRef(null);

  // Safe data merging
  const allOrders = useMemo(() => {
    return [...(orders || []), ...(history || [])];
  }, [orders, history]);
  
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.startedAt);
      // Handle timezone offset simply
      const localDate = d.toLocaleDateString('en-CA');
      return localDate === reportDate;
    }).sort((a, b) => b.startedAt - a.startedAt);
  }, [allOrders, reportDate]);

  const chartData = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredOrders.forEach(o => {
      const d = new Date(o.startedAt);
      const h = d.getHours();
      hours[h] += Number(o.total || 0); 
    });
    return hours;
  }, [filteredOrders]);
  
  const maxSales = Math.max(...chartData, 1);

  // Safe Reduce
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0); 
  const totalFees = filteredOrders.reduce((sum, o) => sum + (o.financials?.processingFee || 0), 0); 
  const totalCash = filteredOrders.filter(o => o.payment?.method === 'CASH').reduce((sum, o) => sum + o.total, 0);
  const totalUPI = filteredOrders.filter(o => o.payment?.method === 'UPI').reduce((sum, o) => sum + o.total, 0);
  const totalCard = filteredOrders.filter(o => o.payment?.method === 'CARD').reduce((sum, o) => sum + o.total, 0);

  // --- CSV EXPORT FUNCTION (Restored) ---
  const exportData = () => {
    if (filteredOrders.length === 0) {
        alert("No sales data to export.");
        return;
    }
    const headers = ["Order ID", "Date", "Time", "Token", "Items", "MRP (Subtotal)", "Discount", "GST", "Proc. Fee", "Grand Total (Paid)", "Payment Mode", "Status"];
    const rows = filteredOrders.map(o => {
        const dateObj = new Date(o.startedAt);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();
        // Escape quotes in item names for CSV safety
        const itemsStr = o.items.map(i => `${i.name} (x${i.quantity})`).join(" | ").replace(/"/g, '""');
        const status = orders.find(active => active.id === o.id) ? "ACTIVE" : "COMPLETED";
        
        return [
            o.displayId, 
            date, 
            time, 
            o.token, 
            `"${itemsStr}"`, 
            o.financials?.subtotal || 0, 
            o.financials?.discount || 0, 
            o.financials?.tax || 0,
            o.financials?.processingFee || 0, 
            o.financials?.finalPayable || o.total,
            o.payment?.method || 'N/A', 
            status
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Sales_Report_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 overflow-hidden ${theme.bgMain} ${theme.textMain}`}>
        {/* Force Visible Scrollbar for Mobile */}
        <style>{`
          .graph-scroll::-webkit-scrollbar { height: 8px; }
          .graph-scroll::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; }
          .graph-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        `}</style>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className={`p-2 rounded-full ${theme.bgHover} border ${theme.border}`}>
                    <ArrowLeft size={24}/>
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">Sales Report <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold">Today</span></h1>
                    <p className={`text-sm ${theme.textSec}`}>Summary for {reportDate}</p>
                </div>
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
                <div onClick={() => dateInputRef.current?.showPicker()} className={`flex-1 md:flex-none flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.bgCard} focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer`}>
                    <CalendarIcon size={18} className={theme.textSec} />
                    <input ref={dateInputRef} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={`bg-transparent outline-none ${theme.textMain} text-sm font-medium w-full cursor-pointer`}/>
                </div>
                <button onClick={exportData} className={`px-4 py-2 ${theme.bgCard} border ${theme.border} rounded-lg flex items-center gap-2 hover:border-blue-500`}>
                    <Download size={18}/><span className="hidden md:inline">Export CSV</span>
                </button>
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                <div className={`${theme.textSec} text-xs md:text-sm`}>Total Revenue</div>
                <div className="text-2xl md:text-3xl font-bold mt-1">₹{totalRevenue}</div>
            </div>
            <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                <div className={`${theme.textSec} text-xs md:text-sm`}>Fees Collected</div>
                <div className="text-2xl md:text-3xl font-bold mt-1 text-orange-500">+₹{totalFees}</div>
            </div>
            <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                <div className={`${theme.textSec} text-xs md:text-sm`}>Total Orders</div>
                <div className="text-2xl md:text-3xl font-bold mt-1">{filteredOrders.length}</div>
            </div>
            <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                <div className={`${theme.textSec} text-xs md:text-sm`}>Cash / Digital</div>
                <div className="flex gap-2 mt-2 text-xs font-bold">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">C: {totalCash}</span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">D: {totalUPI + totalCard}</span>
                </div>
            </div>
        </div>

        {/* Chart with Scroller */}
        <div className={`mb-4 rounded-xl border ${theme.border} ${theme.bgCard} p-4`}>
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-blue-500"/>
                <h2 className="font-bold text-sm">Hourly Sales Performance</h2>
            </div>
            <div className="graph-scroll overflow-x-auto pb-4">
                {/* WIDE Container to force scroll */}
                <div className="h-32 md:h-48 flex gap-2 min-w-[1200px] pt-8 items-end"> 
                    {chartData.map((val, h) => (
                        <div key={h} className="flex-1 flex flex-col justify-end items-center gap-1 group relative h-full"> 
                            {/* Tooltip: Money Only */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:flex group-active:flex flex-col items-center bg-slate-800 text-white text-xs p-2 rounded-lg shadow-xl z-50 pointer-events-none min-w-[60px] left-1/2 -translate-x-1/2">
                                <div className="font-bold text-sm">₹{val}</div>
                                <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                            <div className={`w-full rounded-t-sm transition-all duration-500 ${val > 0 ? 'bg-blue-500 hover:bg-blue-400' : 'bg-stone-100/10'}`} style={{height: `${(val / maxSales) * 100}%`, minHeight: val > 0 ? '4px' : '0'}}></div>
                            <span className={`text-[9px] md:text-[10px] ${theme.textSec}`}>{h}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* History Table */}
        <div className={`flex-1 overflow-hidden rounded-xl border ${theme.border} ${theme.bgCard} flex flex-col`}>
            <div className={`p-3 border-b ${theme.border} flex justify-between items-center bg-opacity-50 ${isDarkMode ? 'bg-slate-800' : 'bg-stone-50'}`}>
                <h2 className="font-bold flex items-center gap-2"><Banknote size={18}/> Transaction History</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`${theme.textSec} border-b ${theme.border} sticky top-0 ${theme.bgCard}`}>
                        <tr>
                            <th className="p-3 font-medium">ID</th>
                            <th className="p-3 font-medium hidden md:table-cell">Time</th>
                            <th className="p-3 font-medium hidden md:table-cell">Items</th>
                            <th className="p-3 font-medium text-stone-500">MRP</th>
                            <th className="p-3 font-medium text-green-500">Disc</th>
                            <th className="p-3 font-medium text-stone-500">GST</th>
                            <th className="p-3 font-medium text-orange-500">Fee</th>
                            <th className="p-3 font-medium">Total</th>
                            <th className="p-3 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredOrders.map((o) => (
                            <tr key={o.id} className={theme.bgHover}>
                                <td className="p-3 font-mono font-bold">#{o.displayId}</td>
                                <td className="p-3 hidden md:table-cell">{new Date(o.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td className="p-3 truncate max-w-xs hidden md:table-cell">{o.items.map(i => i.name).join(", ")}</td>
                                <td className="p-3 text-stone-500">₹{o.financials?.subtotal || 0}</td>
                                <td className="p-3 text-green-500 text-xs font-bold">{o.financials?.discount > 0 ? `-₹${o.financials.discount}` : '-'}</td>
                                <td className="p-3 text-stone-500 text-xs">₹{o.financials?.tax || 0}</td>
                                <td className="p-3 text-orange-500 text-xs font-bold">{o.financials?.processingFee > 0 ? `+₹${o.financials.processingFee}` : '-'}</td>
                                <td className="p-3 font-bold">₹{o.financials?.finalPayable || o.total}</td>
                                <td className="p-3 text-right">
                                    {orders.find(active => active.id === o.id) ? <span className="text-orange-500 text-xs font-bold bg-orange-100 px-2 py-1 rounded">ACT</span> : <span className="text-green-500 text-xs font-bold bg-green-100 px-2 py-1 rounded">DONE</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}