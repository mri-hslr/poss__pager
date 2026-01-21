import React, { useEffect, useState } from 'react';

// IMPORTS
import { MENU_ITEMS, CATEGORIES } from './data';
import CheckoutModal from './CheckoutModal';
import SalesReport from './SalesReport';
import POSView from './POSView';
import ActiveOrdersDrawer from './ActiveOrdersDrawer';
import OrderDetailsModal from './OrderDetailsModal';
import MenuItemModal from './MenuItemModal';
import UserManagementModal from './UserManagementModal';

export default function RestaurantVendorUI({ user, onLogout }) {
  // --- MENU STATE ---
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('vendor_menu');
    if (saved) return JSON.parse(saved);
    let flatMenu = [];
    Object.keys(MENU_ITEMS).forEach(cat => {
      MENU_ITEMS[cat].forEach(item => {
        flatMenu.push({ ...item, category: cat });
      });
    });
    return flatMenu;
  });

  // --- DATA STATE ---
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [nextIdCounter, setNextIdCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATE ---
  const [currentView, setCurrentView] = useState('POS');
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- CART STATE ---
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [discount, setDiscount] = useState(0);

  const taxRate = 5;
  const transactionFeeRate = 0.02;

  // --- LOAD STORAGE ---
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

    } catch {
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- PERSIST ---
  useEffect(() => { if (!isLoading) localStorage.setItem('vendor_orders', JSON.stringify(orders)); }, [orders, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('vendor_history', JSON.stringify(history)); }, [history, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('vendor_menu', JSON.stringify(menuItems)); }, [menuItems, isLoading]);
  useEffect(() => {
    localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- POS LOGIC ---
  const availableTokens = orders.map(o => o.token);
  const freeTokens = Array.from({ length: 20 }, (_, i) => `${i + 1}`).filter(t => !availableTokens.includes(t));

  useEffect(() => {
    if ((!selectedToken || !freeTokens.includes(selectedToken)) && freeTokens.length > 0) {
      setSelectedToken(freeTokens[0]);
    }
  }, [freeTokens, selectedToken]);

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.round((cartSubtotal * taxRate) / 100);
  const maxDiscount = cartSubtotal + taxAmount;
  const grandTotal = Math.max(0, maxDiscount - discount);

  // --- CART ---
  const handleAddToCart = (item) => {
    setCart(p => {
      const f = p.find(c => c.id === item.id);
      return f
        ? p.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...p, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (item) => {
    setCart(p => {
      const f = p.find(c => c.id === item.id);
      if (!f) return p;
      return f.quantity === 1
        ? p.filter(c => c.id !== item.id)
        : p.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  // --- THEME ---
  const theme = {
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-stone-50',
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white',
    textMain: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
  };

  if (isLoading) {
    return <div className={`h-screen flex items-center justify-center ${theme.bgMain} ${theme.textMain}`}>Loading...</div>;
  }

  if (currentView === 'REPORT') {
    return <SalesReport orders={orders} history={history} onBack={() => setCurrentView('POS')} theme={theme} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`h-screen ${theme.bgMain} ${theme.textMain}`}>
      <POSView
        menuItems={menuItems}
        categories={CATEGORIES}
        orders={orders}
        cart={cart}
        selectedToken={selectedToken}
        availableTokens={freeTokens}
        discount={discount}
        grandTotal={grandTotal}
        cartSubtotal={cartSubtotal}
        taxAmount={taxAmount}
        maxDiscount={maxDiscount}
        userRole={user.role}
        userName={user.email}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onCheckout={() => setShowCheckout(true)}
        onLogout={onLogout}
        onToggleTheme={() => setIsDarkMode(p => !p)}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
