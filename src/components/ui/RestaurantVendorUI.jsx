import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  ShoppingCart, Plus, Minus, Check, ChefHat, X, Search,
  Utensils, Clock, BarChart3, Sun, Moon, Percent, ChevronRight
} from 'lucide-react';

// SIBLING IMPORTS
import { MENU_ITEMS, CATEGORIES } from './data';
import OrderTimer from './OrderTimer';
import CheckoutModal from './CheckoutModal';
import SalesReport from './SalesReport';
import POSView from './POSView';
import ActiveOrdersDrawer from './ActiveOrdersDrawer';
import OrderDetailsModal from './OrderDetailsModal';

export default function RestaurantVendorUI() {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [nextIdCounter, setNextIdCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // View & UI State
  const [currentView, setCurrentView] = useState('POS'); 
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDiscountInput, setShowDiscountInput] = useState(false); // Hoisted state if needed
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [discount, setDiscount] = useState(0); 
  
  const taxRate = 5; 
  const transactionFeeRate = 0.02;

  // Refs
  const confirmButtonRef = useRef(null); // Used for focus management

  // --- SAFE STORAGE LOADING ---
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('vendor_orders');
      const savedHistory = localStorage.getItem('vendor_history');
      const savedTheme = localStorage.getItem('pos_theme');

      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedTheme === 'dark') setIsDarkMode(true);
      
      const allIds = [...(JSON.parse(savedOrders || '[]')), ...(JSON.parse(savedHistory || '[]'))]
        .map(o => parseInt(o.displayId || 0));
      if (allIds.length > 0) setNextIdCounter(Math.max(...allIds) + 1);

    } catch (e) {
      console.error("Storage Error:", e);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => { if(!isLoading) localStorage.setItem('vendor_orders', JSON.stringify(orders)); }, [orders, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('vendor_history', JSON.stringify(history)); }, [history, isLoading]);
  useEffect(() => {
    localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- GLOBAL KEYBOARD SHORTCUTS (FIXED) ---
  useEffect(() => {
    const h = (e) => {
      // 1. Handling Esc key to close modals/views in priority order
      if (e.key === 'Escape') {
        if (showCheckout) setShowCheckout(false);
        else if (viewOrder) setViewOrder(null);
        else if (showDiscountInput) setShowDiscountInput(false);
        else if (mobileCartOpen) setMobileCartOpen(false);
        else if (ordersOpen) setOrdersOpen(false);
        else if (currentView === 'REPORT') setCurrentView('POS'); 
      }

      // 2. Global Shortcuts (Only active when no blocking modal is open)
      if (currentView === 'POS' && !showCheckout && !viewOrder && !mobileCartOpen) {
        
        // Ctrl+O : Toggle Active Orders Drawer
        if (e.ctrlKey && e.key.toLowerCase() === 'o') { 
           e.preventDefault(); 
           setOrdersOpen(p => !p); 
        }
        
        // Ctrl+D : Toggle Dark Mode
        if (e.ctrlKey && e.key.toLowerCase() === 'd') { 
           e.preventDefault(); 
           setIsDarkMode(p => !p); 
        }
        
        // Ctrl+F : Focus Search (Handled in POSView, but good to have fallback here if needed)
        // Note: We leave Ctrl+F primarily to POSView to focus the specific input ref
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [viewOrder, showCheckout, showDiscountInput, ordersOpen, currentView, mobileCartOpen]);

  // --- CALCULATIONS ---
  const availableTokens = useMemo(() => {
    const used = orders.map((o) => o.token);
    return Array.from({ length: 20 }, (_, i) => `${i + 1}`).filter(t => !used.includes(t));
  }, [orders]);

  useEffect(() => {
    if ((!selectedToken || !availableTokens.includes(selectedToken)) && availableTokens.length > 0) {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.round((cartSubtotal * taxRate) / 100);
  const maxDiscount = cartSubtotal + taxAmount;
  
  // Safety check for discount
  useEffect(() => { if (discount > maxDiscount) setDiscount(maxDiscount); }, [maxDiscount, discount]);
  const grandTotal = Math.max(0, maxDiscount - discount);
  const estimatedFee = Math.round(grandTotal * transactionFeeRate);

  // --- ACTIONS ---
  const handleAddToCart = (item) => {
    setCart(p => {
      const f = p.find(c => c.id === item.id);
      return f ? p.map(c => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)) : [...p, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (item) => {
    setCart(p => {
      const f = p.find(c => c.id === item.id);
      if (!f) return p;
      return f.quantity === 1 ? p.filter(c => c.id !== item.id) : p.map(c => (c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
    });
  };

  const initiateCheckout = () => {
    if (!cart.length || !selectedToken) return;
    setShowCheckout(true);
  };

  const finalizeOrder = (paymentData) => {
    const activeIds = new Set(orders.map(o => o.displayId));
    let candidateId = nextIdCounter;
    while (activeIds.has(String(candidateId).padStart(3, '0'))) candidateId++;
    
    const finalId = String(candidateId).padStart(3, '0');
    setNextIdCounter(candidateId + 1);

    const isOnline = paymentData.method === 'UPI' || paymentData.method === 'CARD';
    const fee = isOnline ? Math.round(grandTotal * transactionFeeRate) : 0;

    const newOrder = {
      id: Date.now(),
      displayId: finalId,
      token: selectedToken,
      items: cart,
      financials: {
        subtotal: cartSubtotal, tax: taxAmount, discount: discount,
        total: grandTotal, processingFee: fee, finalPayable: grandTotal + fee 
      },
      total: grandTotal, startedAt: Date.now(), payment: paymentData
    };

    setOrders(p => [...p, newOrder]);
    setCart([]); setDiscount(0); setShowCheckout(false);
  };

  const completeOrder = (id) => {
    const order = orders.find(o => o.id === id);
    if (order) {
        setHistory(prev => [...prev, { ...order, status: 'COMPLETED', completedAt: Date.now() }]);
        setOrders(p => p.filter(o => o.id !== id));
        setViewOrder(null);
    }
  };

  // --- THEME ---
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

  if (isLoading) return <div className="h-screen flex items-center justify-center text-stone-500">Loading System...</div>;

  if (currentView === 'REPORT') {
    return <SalesReport orders={orders} history={history} onBack={() => setCurrentView('POS')} theme={theme} isDarkMode={isDarkMode} />;
  }

  // --- RENDER MAIN LAYOUT ---
  return (
    <div className={`h-screen flex flex-col md:flex-row overflow-hidden font-sans transition-colors duration-200 ${theme.bgMain} ${theme.textMain}`}>
      
      {/* 1. Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        onConfirm={finalizeOrder}
        totalPayable={grandTotal + estimatedFee}
        grandTotal={grandTotal}
        selectedToken={selectedToken}
        orderId={String(nextIdCounter).padStart(3, '0')}
        processingFee={estimatedFee}
        theme={theme}
        isDarkMode={isDarkMode}
      />

      {/* 2. Active Orders Drawer */}
      <ActiveOrdersDrawer 
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        orders={orders}
        onCompleteOrder={completeOrder}
        theme={theme}
        isDarkMode={isDarkMode}
      />

      {/* 3. Order Details Modal (Single Order) */}
      <OrderDetailsModal 
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onComplete={completeOrder}
        theme={theme}
      />

      {/* 4. Main POS View */}
      <POSView 
        // Data
        orders={orders}
        cart={cart}
        selectedToken={selectedToken}
        availableTokens={availableTokens}
        discount={discount}
        grandTotal={grandTotal}
        cartSubtotal={cartSubtotal}
        taxAmount={taxAmount}
        maxDiscount={maxDiscount}
        // Actions
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onSetDiscount={setDiscount}
        onSetToken={setSelectedToken}
        onCheckout={initiateCheckout}
        onViewOrder={setViewOrder}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenReport={() => setCurrentView('REPORT')}
        onToggleTheme={() => setIsDarkMode(p => !p)}
        // Theme
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}