import React, { useEffect, useState, useMemo, useRef } from 'react';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import ActiveOrdersDrawer from './ActiveOrdersDrawer';
import SalesReport from './SalesReport';
import MenuItemModal from './MenuItemModal';
import OrderDetailsModal from './OrderDetailsModal';
import UserManagementModal from './UserManagementModal';

export default function RestaurantVendorUI({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Backend State
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState(['General']);
  const hasFetched = useRef(false);
  const API_URL = "http://localhost:3000";

  // Core State
  const [nextIdCounter, setNextIdCounter] = useState(1);
  const [currentView, setCurrentView] = useState('POS');
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');

  // UI Flags
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // --- 1. LOAD & HEAL DATA (Smart ID Logic) ---
  useEffect(() => {
    const loadData = async () => {
        const savedOrders = localStorage.getItem('vendor_orders');
        const savedHistory = localStorage.getItem('vendor_history');
        const savedTheme = localStorage.getItem('pos_theme');

        // Helper: Heal Data (Converts strings to numbers, fixes NaN)
        const sanitize = (list) => {
            if (!list) return [];
            try {
                return JSON.parse(list).map(o => ({
                    ...o,
                    total: Number(o.total) || 0,
                    financials: {
                        subtotal: Number(o.financials?.subtotal) || 0,
                        tax: Number(o.financials?.tax) || 0,
                        discount: Number(o.financials?.discount) || 0,
                        processingFee: Number(o.financials?.processingFee) || 0,
                        finalPayable: Number(o.financials?.finalPayable) || Number(o.total) || 0
                    }
                }));
            } catch (e) { return []; }
        };

        const loadedOrders = sanitize(savedOrders);
        const loadedHistory = sanitize(savedHistory);

        setOrders(loadedOrders);
        setHistory(loadedHistory);

        // --- SMART COUNTER FIX ---
        // Find the highest ID across all data so we never start at #001 again
        const allIds = [...loadedOrders, ...loadedHistory].map(o => parseInt(o.displayId, 10) || 0);
        const maxId = Math.max(0, ...allIds);
        setNextIdCounter(maxId + 1);

        if (savedTheme === 'dark') setIsDarkMode(true);
        setIsDataLoaded(true);

        // Fetch Menu
        if(hasFetched.current) return;
        hasFetched.current = true;
        const token = localStorage.getItem('auth_token');
        
        try {
            const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
            if(res.ok) {
                const data = await res.json();
                const rawItems = Array.isArray(data) ? data : (data.products || []);
                const newMenu = {};
                const newCategories = [];
                rawItems.forEach(p => {
                    const cat = p.category || 'General';
                    if (!newMenu[cat]) { newMenu[cat] = []; newCategories.push(cat); }
                    newMenu[cat].push({ id: p.id, name: p.name, price: Number(p.price), imageQuery: p.name });
                });
                setMenu(newMenu);
                setCategories(newCategories.length > 0 ? newCategories : ['General']);
                if (newCategories.length > 0) setSelectedCategory(newCategories[0]);
            }
        } catch(e) { }
    };
    loadData();
  }, []);

  useEffect(() => { if (isDataLoaded) localStorage.setItem('vendor_orders', JSON.stringify(orders)); }, [orders, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('vendor_history', JSON.stringify(history)); }, [history, isDataLoaded]);
  useEffect(() => { localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  // Logic
  const availableTokens = useMemo(() => {
    const used = orders.map((o) => o.token);
    return Array.from({ length: 50 }, (_, i) => `${i + 1}`).filter(t => !used.includes(String(t)));
  }, [orders]);

  useEffect(() => {
    if ((!selectedToken || !availableTokens.includes(selectedToken)) && availableTokens.length > 0) {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  const addToCart = (item) => setCart(p => { const f = p.find(c => c.id === item.id); return f ? p.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c) : [...p, { ...item, quantity: 1 }]; });
  const removeFromCart = (item) => setCart(p => { const f = p.find(c => c.id === item.id); if (!f) return p; return f.quantity === 1 ? p.filter(c => c.id !== item.id) : p.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c); });

  const finalizeOrder = (data) => {
    // Double check ID uniqueness
    let finalId = nextIdCounter;
    const allIds = new Set([...orders, ...history].map(o => parseInt(o.displayId, 10)));
    while (allIds.has(finalId)) { finalId++; }
    
    setNextIdCounter(finalId + 1);
    
    const newOrder = { 
        ...data, 
        id: Date.now(), 
        displayId: String(finalId).padStart(3, '0'), 
        token: selectedToken, 
        items: cart, 
        financials: { ...data.financials, discount: discount },
        startedAt: Date.now() 
    };
    setOrders(p => [...p, newOrder]);
    setCart([]); setDiscount(0); setShowCheckout(false);
  };

  const completeOrder = (id) => {
    const order = orders.find(o => o.id === id);
    if(order) { setHistory(p => [...p, { ...order, status: 'COMPLETED', completedAt: Date.now() }]); setOrders(p => p.filter(o => o.id !== id)); setViewOrder(null); }
  };

  const handleSaveProduct = async (productData) => {
    const token = localStorage.getItem('auth_token');
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    try { await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(productData) }); window.location.reload(); } catch(e) { }
  };
  const handleDeleteProduct = async () => {
    if(!editingItem) return;
    try { await fetch(`${API_URL}/products/${editingItem.id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }); window.location.reload(); } catch(e) { }
  };

  if (currentView === 'REPORT') return <SalesReport orders={orders} history={history} onBack={() => setCurrentView('POS')} isDarkMode={isDarkMode} />;

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.round(cartSubtotal * 0.05);
  const grandTotal = Math.max(0, cartSubtotal + taxAmount - discount);

  return (
    <div className="h-screen overflow-hidden font-sans">
        <CheckoutModal 
            isOpen={showCheckout} 
            onClose={() => setShowCheckout(false)} 
            onConfirm={finalizeOrder} 
            cartSubtotal={cartSubtotal} 
            taxAmount={taxAmount} 
            discount={discount}
            grandTotal={grandTotal} 
            orderId={nextIdCounter} 
            isDarkMode={isDarkMode} 
        />
        <ActiveOrdersDrawer isOpen={ordersOpen} onClose={() => setOrdersOpen(false)} orders={orders} onCompleteOrder={completeOrder} isDarkMode={isDarkMode} />
        <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} onComplete={completeOrder} isDarkMode={isDarkMode} />
        <MenuItemModal isOpen={itemModalOpen} onClose={() => { setItemModalOpen(false); setEditingItem(null); }} onSave={handleSaveProduct} onDelete={handleDeleteProduct} itemToEdit={editingItem} categories={categories} isDarkMode={isDarkMode} />
        <UserManagementModal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} currentUser={user} />
        <POSView 
            menu={menu} categories={categories} cart={cart} orders={orders} 
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            availableTokens={availableTokens} selectedToken={selectedToken} onSetToken={setSelectedToken}
            onAddToCart={addToCart} onRemoveFromCart={removeFromCart} 
            onCheckout={() => setShowCheckout(true)} onLogout={onLogout}
            userRole={user?.role} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(p => !p)}
            onOpenOrders={() => setOrdersOpen(true)} onOpenReport={() => setCurrentView('REPORT')}
            onViewOrder={setViewOrder} discount={discount} setDiscount={setDiscount}
            onAddItem={() => { setEditingItem(null); setItemModalOpen(true); }}
            onEditItem={(item) => { setEditingItem(item); setItemModalOpen(true); }}
        />
    </div>
  );
}