import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ChefHat,
  X,
  Search,
  Utensils,
  Clock,
  Hash,
  Banknote,
  CreditCard,
  QrCode,
  Moon,
  Sun,
  Percent,
  Download,
  BarChart3,
  ArrowLeft,
  Calendar as CalendarIcon,
  RefreshCcw,
  ChevronRight
} from 'lucide-react';

// --- HELPER: Get Local Date String (YYYY-MM-DD) ---
// Prevents Timezone bugs where "Today" shows as yesterday
const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

// --- Sub-component to isolate timer re-renders ---
const OrderTimer = ({ startedAt, large = false }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');
  
  const colorClass = mins > 15 ? 'text-red-500 font-bold' : mins > 10 ? 'text-orange-500' : 'text-stone-500';
  const sizeClass = large ? 'text-2xl' : 'text-xs';

  return <span className={`font-mono ${colorClass} ${sizeClass}`}>{mins}:{secs}</span>;
};

export default function RestaurantVendorUI() {
  // --- STATE ---
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('vendor_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('vendor_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [nextIdCounter, setNextIdCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pos_theme') === 'dark');
  const [currentView, setCurrentView] = useState('POS'); // 'POS' or 'REPORT'
  const [reportDate, setReportDate] = useState(getLocalDate());

  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [discount, setDiscount] = useState(0); 
  const taxRate = 5; // Global GST Rate

  // Panel States
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Checkout States
  const [paymentMode, setPaymentMode] = useState('CASH'); 
  const [cashReceived, setCashReceived] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --- REFS ---
  const searchRef = useRef(null);
  const categoryRefs = useRef([]);
  const itemRefs = useRef([]);
  const tokenRefs = useRef([]);
  const confirmButtonRef = useRef(null);
  const releaseBtnRef = useRef(null);
  const cashInputRef = useRef(null);
  const discountInputRef = useRef(null);

  // --- DATA ---
  const menu = {
    Starters: [
      { id: 1, name: 'Paneer Tikka', price: 180, imageQuery: 'Paneer Tikka dish' },
      { id: 2, name: 'Spring Rolls', price: 120 },
      { id: 3, name: 'Chicken Wings', price: 220 },
      { id: 4, name: 'French Fries', price: 80 },
    ],
    'Main Course': [
      { id: 10, name: 'Butter Chicken', price: 280, imageQuery: 'Butter Chicken dish' },
      { id: 11, name: 'Dal Makhani', price: 180 },
      { id: 12, name: 'Paneer Butter Masala', price: 240 },
      { id: 14, name: 'Chicken Biryani', price: 260 },
      { id: 15, name: 'Naan', price: 40 },
      { id: 16, name: 'Roti', price: 20 },
    ],
    Beverages: [
      { id: 18, name: 'Cold Coffee', price: 120, imageQuery: 'Cold Coffee glass' },
      { id: 19, name: 'Lassi', price: 80 },
      { id: 20, name: 'Lemon Soda', price: 60 },
    ],
  };

  const categories = Object.keys(menu);

  // --- EFFECTS ---
  useEffect(() => {
    if (!selectedCategory) setSelectedCategory(categories[0]);
  }, []);

  useEffect(() => {
    localStorage.setItem('vendor_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('vendor_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, menu[selectedCategory]?.length || 0);
  }, [selectedCategory, menu]);
  
  useEffect(() => {
    tokenRefs.current = tokenRefs.current.slice(0, orders.length);
  }, [orders]);

  // Focus Management
  useEffect(() => {
    if (viewOrder) setTimeout(() => releaseBtnRef.current?.focus(), 50);
  }, [viewOrder]);

  useEffect(() => {
    if (showCheckout) {
      setTimeout(() => cashInputRef.current?.focus(), 50);
      setCashReceived('');
    }
  }, [showCheckout]);

  useEffect(() => {
    if (showDiscountInput) setTimeout(() => discountInputRef.current?.focus(), 50);
  }, [showDiscountInput]);

  // Global Shortcuts
  useEffect(() => {
    const h = (e) => {
      // Escape Logic Priority
      if (e.key === 'Escape') {
        if (showCheckout) setShowCheckout(false);
        else if (viewOrder) setViewOrder(null);
        else if (showDiscountInput) setShowDiscountInput(false);
        else if (mobileCartOpen) setMobileCartOpen(false);
        else if (ordersOpen) setOrdersOpen(false);
        else if (currentView === 'REPORT') setCurrentView('POS'); 
      }

      // POS Shortcuts
      if (currentView === 'POS' && !showCheckout && !viewOrder && !mobileCartOpen) {
        if (e.ctrlKey && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          setOrdersOpen((p) => !p);
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }

      // Global Theme Toggle
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDarkMode(p => !p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [viewOrder, showCheckout, showDiscountInput, ordersOpen, currentView, mobileCartOpen]);

  // --- CALCULATIONS ---
  const availableTokens = useMemo(() => {
    const used = orders.map((o) => o.token);
    return Array.from({ length: 20 }, (_, i) => `${i + 1}`).filter(
      (t) => !used.includes(t)
    );
  }, [orders]);

  useEffect(() => {
    if ((!selectedToken || !availableTokens.includes(selectedToken)) && availableTokens.length > 0) {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  const qty = (id) => cart.find((c) => c.id === id)?.quantity || 0;
  
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.round((cartSubtotal * taxRate) / 100);
  const grandTotal = Math.max(0, cartSubtotal + taxAmount - discount);

  // --- ACTIONS ---
  const addToCart = (item) => {
    setCart((p) => {
      const f = p.find((c) => c.id === item.id);
      return f
        ? p.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
        : [...p, { ...item, quantity: 1 }];
    });
  };

  const dec = (item) => {
    setCart((p) => {
      const f = p.find((c) => c.id === item.id);
      if (!f) return p;
      return f.quantity === 1
        ? p.filter((c) => c.id !== item.id)
        : p.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
    });
  };

  const initiateCheckout = () => {
    if (!cart.length || !selectedToken) return;
    setShowCheckout(true);
  };

  const finalizeOrder = () => {
    const activeIds = new Set(orders.map(o => o.displayId));
    let candidateId = nextIdCounter;
    while (activeIds.has(String(candidateId).padStart(3, '0'))) {
      candidateId++;
    }
    const finalId = String(candidateId).padStart(3, '0');
    setNextIdCounter(candidateId + 1);

    const newOrder = {
      id: Date.now(),
      displayId: finalId,
      token: selectedToken,
      items: cart,
      financials: {
        subtotal: cartSubtotal,
        tax: taxAmount,
        discount: discount,
        total: grandTotal
      },
      total: grandTotal,
      startedAt: Date.now(),
      payment: {
        method: paymentMode,
        received: paymentMode === 'CASH' ? Number(cashReceived) : grandTotal,
        change: paymentMode === 'CASH' ? Number(cashReceived) - grandTotal : 0
      }
    };

    setOrders((p) => [...p, newOrder]);
    setCart([]);
    setDiscount(0);
    setShowCheckout(false);
    setMobileCartOpen(false);
  };

  const completeOrder = (id) => {
    const orderToArchive = orders.find(o => o.id === id);
    if (orderToArchive) {
        setHistory(prev => [...prev, { ...orderToArchive, status: 'COMPLETED', completedAt: Date.now() }]);
        setOrders((p) => p.filter((o) => o.id !== id));
        setViewOrder(null);
    }
  };

  const exportData = (dataToExport) => {
    const data = dataToExport || [...history, ...orders]; 
    if (data.length === 0) {
        alert("No sales data to export for this selection.");
        return;
    }

    const headers = ["Order ID", "Date", "Time", "Token", "Items", "Subtotal", "Tax", "Discount", "Total", "Payment Mode", "Status"];
    const rows = data.map(o => {
        const dateObj = new Date(o.startedAt);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();
        const itemsStr = o.items.map(i => `${i.name} (x${i.quantity})`).join(" | ");
        const status = orders.find(active => active.id === o.id) ? "ACTIVE" : "COMPLETED";

        return [
            o.displayId,
            date,
            time,
            o.token,
            `"${itemsStr}"`, 
            o.financials?.subtotal || 0,
            o.financials?.tax || 0,
            o.financials?.discount || 0,
            o.total,
            o.payment?.method || 'N/A',
            status
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Report_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DYNAMIC STYLES ---
  const theme = {
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-stone-50',
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white',
    bgHover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-stone-50',
    textMain: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    textSec: isDarkMode ? 'text-slate-400' : 'text-stone-500',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-stone-100',
    accent: isDarkMode ? 'bg-blue-600' : 'bg-stone-900',
    accentText: 'text-white'
  };

  // --- POS KEYBOARD HANDLERS ---
  const handleSearchKeyDown = (e) => {
    if(showCheckout || mobileCartOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (orders.length > 0) tokenRefs.current[0]?.focus();
      else categoryRefs.current[0]?.focus();
    }
  };
  const handleTokenKeyDown = (e, index, order) => {
    if(showCheckout || mobileCartOpen) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); tokenRefs.current[(index + 1) % orders.length]?.focus(); } 
    else if (e.key === 'ArrowLeft') { e.preventDefault(); tokenRefs.current[(index - 1 + orders.length) % orders.length]?.focus(); } 
    else if (e.key === 'ArrowDown') { e.preventDefault(); categoryRefs.current[0]?.focus(); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); searchRef.current?.focus(); } 
    else if (e.key === 'Enter') { e.preventDefault(); setViewOrder(order); }
  };
  const handleCategoryKeyDown = (e, index) => {
    if(showCheckout || mobileCartOpen) return;
    if (e.key === 'Tab') { e.preventDefault(); itemRefs.current[0]?.focus(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); const next = (index + 1) % categories.length; setSelectedCategory(categories[next]); categoryRefs.current[next]?.focus(); } 
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const prev = (index - 1 + categories.length) % categories.length; setSelectedCategory(categories[prev]); categoryRefs.current[prev]?.focus(); } 
    else if (e.key === 'ArrowDown') { e.preventDefault(); itemRefs.current[0]?.focus(); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (orders.length > 0) tokenRefs.current[0]?.focus(); else searchRef.current?.focus(); }
  };
  const filteredItems = menu[selectedCategory]?.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleMenuItemKeyDown = (e, index, item) => {
    if(showCheckout || mobileCartOpen) return;
    const totalItems = filteredItems.length;
    const gridCols = window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    if (e.key === 'Tab') { e.preventDefault(); const nextIndex = index + gridCols; if (nextIndex < totalItems) itemRefs.current[nextIndex]?.focus(); else confirmButtonRef.current?.focus(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); itemRefs.current[(index + 1) % totalItems]?.focus(); } 
    else if (e.key === 'ArrowLeft') { e.preventDefault(); itemRefs.current[(index - 1 + totalItems) % totalItems]?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const nextIndex = index + gridCols; if (nextIndex >= totalItems) confirmButtonRef.current?.focus(); else itemRefs.current[nextIndex]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (index < gridCols) { const catIndex = categories.indexOf(selectedCategory); categoryRefs.current[catIndex]?.focus(); } else { itemRefs.current[Math.max(index - gridCols, 0)]?.focus(); } }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addToCart(item); }
    else if (e.key === 'Backspace') { e.preventDefault(); dec(item); }
  };
  const handleConfirmButtonKeyDown = (e) => {
    if(showCheckout || mobileCartOpen) return;
    if (e.key === 'Tab') { e.preventDefault(); if (orders.length > 0) tokenRefs.current[0]?.focus(); else { setSelectedCategory(categories[0]); categoryRefs.current[0]?.focus(); } }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (filteredItems.length > 0) itemRefs.current[filteredItems.length - 1]?.focus(); else { const catIndex = categories.indexOf(selectedCategory); categoryRefs.current[catIndex]?.focus(); } }
  };
  const handleCheckoutKeyDown = (e) => {
    if (e.key === 'Escape') setShowCheckout(false);
    if (e.key === 'ArrowRight') setPaymentMode(prev => prev === 'CASH' ? 'UPI' : prev === 'UPI' ? 'CARD' : 'CASH');
    if (e.key === 'ArrowLeft') setPaymentMode(prev => prev === 'CASH' ? 'CARD' : prev === 'CARD' ? 'UPI' : 'CASH');
    if (e.key === 'Enter') { if (paymentMode === 'CASH') { if (Number(cashReceived) >= grandTotal) finalizeOrder(); } else { finalizeOrder(); } }
  };

  // --- RENDER COMPONENT: REPORT DASHBOARD ---
  const SalesReport = () => {
    // 1. Filter Logic (Using LOCAL time comparison)
    const allOrders = [...orders, ...history];
    const filteredOrders = allOrders.filter(o => {
      const d = new Date(o.startedAt);
      const offset = d.getTimezoneOffset() * 60000;
      const localYMD = new Date(d.getTime() - offset).toISOString().split('T')[0];
      return localYMD === reportDate;
    }).sort((a, b) => b.startedAt - a.startedAt);

    // 2. Stats Logic
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCash = filteredOrders.filter(o => o.payment?.method === 'CASH').reduce((sum, o) => sum + o.total, 0);
    const totalUPI = filteredOrders.filter(o => o.payment?.method === 'UPI').reduce((sum, o) => sum + o.total, 0);
    const totalCard = filteredOrders.filter(o => o.payment?.method === 'CARD').reduce((sum, o) => sum + o.total, 0);

    // REPORT REFS
    const backBtnRef = useRef(null);
    const dateInputRef = useRef(null);
    const exportBtnRef = useRef(null);

    // Auto-focus Back button on mount
    useEffect(() => { setTimeout(() => backBtnRef.current?.focus(), 50); }, []);

    // REPORT NAVIGATION
    const handleReportNav = (e, type) => {
        if (e.key === 'Backspace') { setCurrentView('POS'); }
        if (type === 'BACK') { if (e.key === 'ArrowRight') dateInputRef.current?.focus(); }
        if (type === 'DATE') { 
            if (e.key === 'ArrowLeft') backBtnRef.current?.focus(); 
            if (e.key === 'ArrowRight') exportBtnRef.current?.focus();
        }
        if (type === 'EXPORT') { if (e.key === 'ArrowLeft') dateInputRef.current?.focus(); }
    };

    return (
        <div className={`h-full flex flex-col p-4 md:p-6 overflow-hidden ${theme.bgMain} ${theme.textMain}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <button ref={backBtnRef} onKeyDown={(e) => handleReportNav(e, 'BACK')} onClick={() => setCurrentView('POS')} className={`p-2 rounded-full ${theme.bgHover} border ${theme.border} outline-none focus:ring-2 focus:ring-blue-500`}>
                        <ArrowLeft size={24}/>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">Sales Report {reportDate === getLocalDate() && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold">Today</span>}</h1>
                        <p className={`text-sm ${theme.textSec}`}>Summary for {reportDate}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center w-full md:w-auto">
                    <div className={`flex-1 md:flex-none flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.bgCard} focus-within:ring-2 focus-within:ring-blue-500`}>
                        <CalendarIcon size={18} className={theme.textSec} />
                        <input ref={dateInputRef} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} onKeyDown={(e) => handleReportNav(e, 'DATE')} className={`bg-transparent outline-none ${theme.textMain} text-sm font-medium w-full`}/>
                    </div>
                    <button ref={exportBtnRef} onKeyDown={(e) => handleReportNav(e, 'EXPORT')} onClick={() => exportData(filteredOrders)} className={`px-4 py-2 ${theme.bgCard} border ${theme.border} rounded-lg flex items-center gap-2 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none whitespace-nowrap`}><Download size={18}/><span className="hidden md:inline">Export</span></button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                    <div className={`${theme.textSec} text-xs md:text-sm`}>Total Revenue</div>
                    <div className="text-2xl md:text-3xl font-bold mt-1">₹{totalRevenue}</div>
                </div>
                <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                    <div className={`${theme.textSec} text-xs md:text-sm`}>Total Orders</div>
                    <div className="text-2xl md:text-3xl font-bold mt-1">{filteredOrders.length}</div>
                </div>
                <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                    <div className={`${theme.textSec} text-xs md:text-sm`}>Avg Order</div>
                    <div className="text-2xl md:text-3xl font-bold mt-1">₹{filteredOrders.length ? Math.round(totalRevenue / filteredOrders.length) : 0}</div>
                </div>
                <div className={`${theme.bgCard} p-3 md:p-4 rounded-xl border ${theme.border} shadow-sm`}>
                    <div className={`${theme.textSec} text-xs md:text-sm`}>Cash / Digital</div>
                    <div className="flex gap-2 mt-2 text-xs font-bold">
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">C: {totalCash}</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">D: {totalUPI + totalCard}</span>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className={`flex-1 overflow-hidden rounded-xl border ${theme.border} ${theme.bgCard} flex flex-col`}>
                <div className={`p-3 border-b ${theme.border} flex justify-between items-center bg-opacity-50 ${isDarkMode ? 'bg-slate-800' : 'bg-stone-50'}`}>
                    <h2 className="font-bold flex items-center gap-2"><Banknote size={18}/> <span className="hidden md:inline">Transaction History</span><span className="md:hidden">History</span></h2>
                    <button onClick={() => setReportDate(getLocalDate())} className={`text-xs flex items-center gap-1 ${theme.textSec} hover:text-blue-500`}><RefreshCcw size={12}/> Reset</button>
                </div>
                <div className="flex-1 overflow-y-auto focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none" tabIndex={0}>
                    <table className="w-full text-sm text-left">
                        <thead className={`${theme.textSec} border-b ${theme.border} sticky top-0 ${theme.bgCard}`}>
                            <tr>
                                <th className="p-3 font-medium">ID</th>
                                <th className="p-3 font-medium hidden md:table-cell">Time</th>
                                <th className="p-3 font-medium hidden md:table-cell">Items</th>
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
                                    <td className="p-3 font-bold">₹{o.total}</td>
                                    <td className="p-3 text-right">
                                        {orders.find(active => active.id === o.id) ? <span className="text-orange-500 text-xs font-bold bg-orange-100 px-2 py-1 rounded">ACT</span> : <span className="text-green-500 text-xs font-bold bg-green-100 px-2 py-1 rounded">DONE</span>}
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-stone-400">No transactions found for {reportDate}.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  if (currentView === 'REPORT') return <SalesReport />;

  return (
    <div className={`h-screen flex flex-col md:flex-row overflow-hidden font-sans transition-colors duration-200 ${theme.bgMain} ${theme.textMain}`}>
      
      {/* --- CHECKOUT MODAL (FULL SCREEN MOBILE) --- */}
      {showCheckout && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center animate-in fade-in duration-200" onKeyDown={handleCheckoutKeyDown}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
            <div className={`relative ${theme.bgCard} w-full md:max-w-md h-[90vh] md:h-auto rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col`}>
                <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-stone-900'} text-white p-6 flex justify-between items-center shrink-0`}>
                    <div>
                        <div className="text-stone-400 text-sm font-medium uppercase tracking-wider">Total Payable</div>
                        <div className="text-4xl font-bold">₹{grandTotal}</div>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-mono">Token {selectedToken}</div>
                    </div>
                </div>
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
                                    <input ref={cashInputRef} type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className={`w-full pl-8 pr-4 py-3 text-2xl font-bold ${theme.bgCard} ${theme.textMain} ${theme.border} border rounded-xl focus:ring-4 focus:ring-blue-500 outline-none`} placeholder="0"/>
                                </div>
                            </div>
                            <div className={`flex justify-between items-center pt-2 border-t border-dashed ${theme.border}`}>
                                <span className={theme.textSec}>Change</span>
                                <span className={`text-2xl font-bold ${(Number(cashReceived) - grandTotal) < 0 ? 'text-stone-500' : 'text-green-500'}`}>₹{Math.max(0, Number(cashReceived) - grandTotal)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 flex flex-col items-center text-center gap-2">
                             <CreditCard size={48} className="text-blue-400"/>
                             <div className="text-blue-500 font-medium">Waiting for Payment...</div>
                        </div>
                    )}
                    <button onClick={finalizeOrder} disabled={paymentMode === 'CASH' && Number(cashReceived) < grandTotal} className={`w-full py-4 ${theme.accent} ${theme.accentText} rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-xl`}>
                        {paymentMode === 'CASH' ? (Number(cashReceived) < grandTotal ? 'Enter Full Amount' : `Accept & Print Bill`) : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW ORDER MODAL --- */}
      {viewOrder && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewOrder(null)} />
          <div className={`relative ${theme.bgCard} w-full md:max-w-sm h-[80vh] md:h-auto rounded-t-3xl md:rounded-2xl shadow-2xl p-6 flex flex-col gap-4 mx-0 md:mx-4`}>
            <div className={`flex justify-between items-start border-b ${theme.border} pb-4 shrink-0`}>
               <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">Token {viewOrder.token}</span>
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">#{viewOrder.displayId}</span>
                  </div>
                  <div className={`${theme.textSec} text-sm mt-1 flex items-center gap-2`}><Clock size={14} /> Preparing <OrderTimer startedAt={viewOrder.startedAt} /></div>
               </div>
               <button onClick={() => setViewOrder(null)} className={`p-2 ${theme.bgHover} rounded-full ${theme.textSec}`}><X size={24} /></button>
            </div>
            <div className="py-2 space-y-3 overflow-y-auto flex-1">
               {viewOrder.items.map((item) => (
                 <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="font-bold">{item.name}</div>
                       <div className="text-stone-400 text-xs">x{item.quantity}</div>
                    </div>
                    <div className="font-mono">₹{item.price * item.quantity}</div>
                 </div>
               ))}
               <div className={`border-t border-dashed ${theme.border} my-2`}></div>
               <div className="flex justify-between items-center text-lg font-bold"><span>Total Bill</span><span>₹{viewOrder.total}</span></div>
            </div>
            <div className="pt-2 flex flex-col gap-2 shrink-0">
               <button ref={releaseBtnRef} onClick={() => completeOrder(viewOrder.id)} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Check size={20} /> Mark Ready</button>
               <button onClick={() => setViewOrder(null)} className={`w-full py-2 ${theme.textSec} hover:${theme.textMain} font-medium text-sm`}>Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ACTIVE ORDERS SIDEBAR (MOBILE: FULL SCREEN) --- */}
      {ordersOpen && (
        <div className="fixed inset-0 z-50 flex justify-start animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOrdersOpen(false)} />
          <div className={`relative ${theme.bgCard} w-full md:w-full md:max-w-md h-full shadow-2xl flex flex-col`}>
            <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
              <h2 className="font-bold text-lg flex items-center gap-2"><ChefHat className="text-orange-500" /> Active Orders</h2>
              <button onClick={() => setOrdersOpen(false)} className={`p-2 ${theme.bgHover} rounded-full`}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {orders.map((o) => (
                <div key={o.id} className={`border ${theme.border} ${theme.bgCard} rounded-xl shadow-sm overflow-hidden`}>
                  <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-stone-50'} p-3 flex justify-between items-center border-b ${theme.border}`}>
                    <div className="flex gap-2 items-center">
                      <span className={`font-bold ${theme.accent} text-white px-2 py-0.5 rounded text-sm`}>T-{o.token}</span>
                      <span className={`text-xs font-bold ${theme.textSec}`}>#{o.displayId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderTimer startedAt={o.startedAt} />
                      <button onClick={() => completeOrder(o.id)} className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded-full"><Check size={16} /></button>
                    </div>
                  </div>
                  <div className="p-3">
                    {o.items.map((i) => (
                      <div key={i.id} className={`flex justify-between text-sm py-1 border-b border-dashed last:border-0 ${theme.border}`}>
                        <span>{i.name} <span className="text-stone-400 text-xs">x{i.quantity}</span></span>
                      </div>
                    ))}
                    <div className="text-right font-bold mt-2">₹{o.total}</div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div className={`text-center mt-10 ${theme.textSec}`}>No active orders.</div>}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className={`${theme.bgCard} border-b ${theme.border} px-4 md:px-6 py-3 md:py-4 flex justify-between items-center gap-4 shadow-sm z-10 shrink-0`}>
          <div>
            <h1 className="text-lg md:text-xl font-bold">POS</h1>
            <p className={`text-xs ${theme.textSec} hidden md:block`}><span className="cursor-pointer text-blue-500 hover:underline" onClick={() => setOrdersOpen(true)}>Manage Active (Ctrl+O)</span></p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full justify-end">
             <div className="relative w-full max-w-[180px] md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input ref={searchRef} onKeyDown={handleSearchKeyDown} className={`w-full pl-9 pr-4 py-2 ${theme.inputBg} border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none ${theme.textMain}`} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
             </div>
             <button onClick={() => setOrdersOpen(true)} className={`md:hidden p-2 rounded-full ${theme.bgHover} ${theme.textSec} border ${theme.border}`}><ChefHat size={18} /></button>
             <button onClick={() => setCurrentView('REPORT')} className={`p-2 rounded-full ${theme.bgHover} ${theme.textSec} border ${theme.border}`}><BarChart3 size={18} /></button>
             <button onClick={() => setIsDarkMode(p => !p)} className={`p-2 rounded-full ${theme.bgHover} ${theme.textSec} border ${theme.border}`}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>

        {/* Token Strip */}
        {orders.length > 0 && (
          <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-stone-50'} border-b ${theme.border} px-4 md:px-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0`}>
             <div className="flex gap-3 items-center">
                {orders.map((o, index) => (
                   <button key={o.id} ref={el => tokenRefs.current[index] = el} onKeyDown={(e) => handleTokenKeyDown(e, index, o)} onClick={() => setViewOrder(o)} className={`cursor-pointer inline-flex items-center gap-2 ${theme.bgCard} border ${theme.border} rounded-full px-1 py-1 pr-3 shadow-sm transition-all`}>
                      <span className={`text-xs font-bold text-white ${theme.accent} px-2 py-0.5 rounded-full`}>T-{o.token}</span>
                      <span className={`text-xs font-mono border-l pl-2 ${theme.border}`}><OrderTimer startedAt={o.startedAt} /></span>
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* Categories */}
        <div className={`${theme.bgCard} border-b ${theme.border} px-4 md:px-6 py-2 overflow-x-auto whitespace-nowrap shrink-0`}>
          <div className="flex gap-2">
            {categories.map((cat, i) => (
              <button key={cat} ref={(el) => (categoryRefs.current[i] = el)} onClick={() => setSelectedCategory(cat)} onKeyDown={(e) => handleCategoryKeyDown(e, i)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-500 ${selectedCategory === cat ? `${theme.accent} text-white shadow-md` : `${isDarkMode ? 'bg-slate-800' : 'bg-stone-100'} ${theme.textSec}`}`}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${isDarkMode ? 'bg-slate-950' : 'bg-stone-50/50'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-20">
            {filteredItems?.map((i, index) => (
              <div key={i.id} ref={(el) => (itemRefs.current[index] = el)} tabIndex={0} onKeyDown={(e) => handleMenuItemKeyDown(e, index, i)} onClick={() => addToCart(i)} className={`${theme.bgCard} border ${theme.border} rounded-xl p-3 md:p-4 shadow-sm active:scale-95 transition-all flex flex-col gap-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500`}>
                <div className="flex gap-3 pointer-events-none">
                  <div className={`w-14 h-14 md:w-16 md:h-16 ${theme.inputBg} rounded-lg flex items-center justify-center overflow-hidden shrink-0`}>
                     {i.imageQuery ? <div className="w-full h-full object-cover text-[10px] flex items-center justify-center text-center text-stone-400"><Utensils size={20} /></div> : <Utensils className="text-stone-300" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold leading-tight text-sm md:text-base">{i.name}</h3>
                    <div className={`${theme.textSec} text-xs md:text-sm mt-1`}>₹{i.price}</div>
                  </div>
                </div>
                <div className={`flex items-center justify-between mt-auto pt-2 border-t ${theme.border} pointer-events-none`}>
                  {qty(i.id) > 0 ? (
                    <div className={`flex items-center gap-3 ${theme.inputBg} rounded-lg px-2 py-1 w-full justify-between`}>
                      <span className="font-semibold text-sm w-4 text-center">{qty(i.id)}</span>
                    </div>
                  ) : <div className="w-full text-center text-stone-400 text-xs">Add</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- MOBILE BOTTOM CART BAR --- */}
        {cart.length > 0 && (
          <div className="md:hidden absolute bottom-4 left-4 right-4 z-40">
            <button 
              onClick={() => setMobileCartOpen(true)}
              className={`w-full ${theme.accent} text-white p-4 rounded-2xl shadow-xl flex justify-between items-center`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </div>
                <div className="text-left">
                  <div className="text-xs opacity-80">Total</div>
                  <div className="font-bold">₹{cartSubtotal}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm">
                View Cart <ChevronRight size={16} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* --- CART SIDEBAR (DESKTOP + MOBILE SLIDE-OVER) --- */}
      {/* Background Overlay for Mobile */}
      {mobileCartOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setMobileCartOpen(false)} />
      )}
      
      <div className={`fixed inset-y-0 right-0 w-[85%] md:w-[380px] ${theme.bgCard} border-l ${theme.border} h-full flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ${mobileCartOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} md:static`}>
        <div className={`p-5 border-b ${theme.border} ${isDarkMode ? 'bg-slate-900' : 'bg-stone-50'} flex justify-between items-center`}>
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Current Order</h2>
          <button onClick={() => setMobileCartOpen(false)} className="md:hidden p-2 bg-stone-100 rounded-full"><X size={20} className="text-black"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p>Start adding items</p>
            </div>
          ) : (
            cart.map((i) => (
              <div key={i.id} className={`flex justify-between items-center py-3 border-b ${theme.border} last:border-0 group`}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{i.name}</div>
                  <div className={`text-xs ${theme.textSec}`}>₹{i.price * i.quantity}</div>
                </div>
                <div className={`flex items-center gap-2 ${theme.inputBg} rounded-lg border ${theme.border} px-1 py-0.5`}>
                  <button onClick={() => dec(i)} className={`p-1 ${theme.bgHover} rounded shadow-sm`}><Minus size={12} /></button>
                  <span className="text-xs font-semibold w-4 text-center">{i.quantity}</span>
                  <button onClick={() => addToCart(i)} className={`p-1 ${theme.bgHover} rounded shadow-sm`}><Plus size={12} /></button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className={`p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-stone-50'} border-t ${theme.border} space-y-3`}>
           <div className="space-y-1 text-sm">
             <div className={`flex justify-between ${theme.textSec}`}><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
             <div className={`flex justify-between ${theme.textSec}`}><span>Tax (5%)</span><span>+₹{taxAmount}</span></div>
             <div className={`flex justify-between ${theme.textSec}`}><span>Discount</span><span className={discount > 0 ? 'text-green-500' : ''}>-₹{discount}</span></div>
           </div>

           <div className="flex items-center gap-2">
             {showDiscountInput ? (
               <div className="flex items-center gap-2 w-full animate-in fade-in">
                  <span className="text-xs font-bold text-stone-400">₹</span>
                  <input ref={discountInputRef} type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className={`w-full p-2 text-sm rounded-lg ${theme.inputBg} ${theme.textMain} outline-none border ${theme.border}`} placeholder="Disc Amount"/>
                  <button onClick={() => setShowDiscountInput(false)} className="p-2 bg-stone-200 text-stone-600 rounded-lg"><Check size={14}/></button>
               </div>
             ) : (
               <button onClick={() => setShowDiscountInput(true)} className={`text-xs flex items-center gap-1 ${theme.textSec} hover:text-blue-500`}><Percent size={12}/> Add Discount</button>
             )}
           </div>

           <div className={`flex justify-between items-center text-xl font-bold ${theme.textMain} pt-2 border-t ${theme.border}`}><span>Total</span><span>₹{grandTotal}</span></div>

           <div className="space-y-2 pt-2">
             <select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)} className={`w-full p-2.5 rounded-lg border ${theme.border} ${theme.bgCard} ${theme.textMain} text-sm focus:ring-2 focus:ring-blue-500 outline-none`}>
              {availableTokens.length === 0 ? <option disabled>No Tokens</option> : <><option value="" disabled>Select Token</option>{availableTokens.map((t) => <option key={t} value={t}>Token {t}</option>)}</>}
             </select>
             <button ref={confirmButtonRef} onKeyDown={handleConfirmButtonKeyDown} onClick={initiateCheckout} disabled={!cart.length || !selectedToken} className={`w-full py-3 ${theme.accent} ${theme.accentText} rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg`}>Checkout</button>
           </div>
        </div>
      </div>
    </div>
  );
}