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
  // --- 1. MENU STATE ---
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

  // --- 2. DATA STATE (Orders & History) ---
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [nextIdCounter, setNextIdCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- 3. UI STATE ---
  const [currentView, setCurrentView] = useState('POS');
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- 4. CART STATE ---
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [discount, setDiscount] = useState(0);

  // --- 5. REAL USER MANAGEMENT STATE ---
  const [users, setUsers] = useState([]); 

  // Fetch Users from Database
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  // Add User via Server
  const handleAddUser = async (newUser) => {
    try {
      const res = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("User added successfully!");
        fetchUsers(); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Failed to connect to server");
    }
  };

  // Delete User via Server
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;

    try {
      const res = await fetch(`http://localhost:3000/users/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsers(); 
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Load users when modal opens
  useEffect(() => {
    if (userModalOpen) {
      fetchUsers();
    }
  }, [userModalOpen]);

  // --- CONFIG ---
  const taxRate = 5;

  // --- 6. LOAD STORAGE & RESET DAILY ID ---
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('vendor_orders');
      const savedHistory = localStorage.getItem('vendor_history');
      const savedTheme = localStorage.getItem('pos_theme');

      const parsedOrders = savedOrders ? JSON.parse(savedOrders) : [];
      const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];

      if (savedOrders) setOrders(parsedOrders);
      if (savedHistory) setHistory(parsedHistory);
      if (savedTheme === 'dark') setIsDarkMode(true);

      // --- DAILY RESET LOGIC ---
      const todayString = new Date().toLocaleDateString();

      // Filter history to find only TODAY'S orders
      const todaysHistory = parsedHistory.filter(order => {
        const orderDate = new Date(order.startedAt || Date.now()).toLocaleDateString();
        return orderDate === todayString;
      });

      // Combine active orders + today's completed orders
      const relevantOrders = [...parsedOrders, ...todaysHistory];

      // Find the highest ID among ONLY today's orders
      if (relevantOrders.length > 0) {
        const maxId = Math.max(...relevantOrders.map(o => parseInt(o.displayId || 0)));
        setNextIdCounter(maxId + 1);
      } else {
        setNextIdCounter(1); // Start fresh if no orders today
      }

    } catch (e) {
      console.error("Storage Error:", e);
      localStorage.clear();
      setNextIdCounter(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 7. DATA PERSISTENCE ---
  useEffect(() => { if (!isLoading) localStorage.setItem('vendor_orders', JSON.stringify(orders)); }, [orders, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('vendor_history', JSON.stringify(history)); }, [history, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem('vendor_menu', JSON.stringify(menuItems)); }, [menuItems, isLoading]);
  useEffect(() => {
    localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- 8. KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCheckout) setShowCheckout(false);
        else if (viewOrder) setViewOrder(null);
        else if (itemModalOpen) setItemModalOpen(false);
        else if (userModalOpen) setUserModalOpen(false);
        else if (ordersOpen) setOrdersOpen(false);
        else if (currentView === 'REPORT') setCurrentView('POS');
      }

      if (user && currentView === 'POS' && !showCheckout && !viewOrder && !itemModalOpen && !userModalOpen) {
        if (e.ctrlKey && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          setOrdersOpen(prev => !prev);
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setIsDarkMode(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewOrder, showCheckout, ordersOpen, currentView, itemModalOpen, userModalOpen, user]);

  // --- 9. POS LOGIC ---
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
  
  if (discount > maxDiscount && discount !== 0) setDiscount(maxDiscount);
  const grandTotal = Math.max(0, maxDiscount - discount);

  // --- 10. HANDLERS ---
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

  const finalizeOrder = (paymentData) => {
    let candidateId = nextIdCounter;
    const activeIds = new Set(orders.map(o => o.displayId));
    while (activeIds.has(String(candidateId).padStart(3, '0'))) candidateId++;
    setNextIdCounter(candidateId + 1);

    const fee = paymentData.fee || 0;
    const netRevenue = grandTotal - fee;

    const newOrder = {
      id: Date.now(),
      displayId: String(candidateId).padStart(3, '0'),
      token: selectedToken,
      items: cart,
      financials: { 
        subtotal: cartSubtotal, tax: taxAmount, discount: discount, total: grandTotal, 
        processingFee: fee, netRevenue: netRevenue, finalPayable: grandTotal 
      },
      total: grandTotal, startedAt: Date.now(), payment: paymentData
    };
    setOrders(p => [...p, newOrder]);
    setCart([]); 
    setDiscount(0); 
    setShowCheckout(false);
  };

  const completeOrder = (id) => {
    const order = orders.find(o => o.id === id);
    if (order) {
        setHistory(prev => [...prev, { ...order, status: 'COMPLETED', completedAt: Date.now() }]);
        setOrders(p => p.filter(o => o.id !== id));
        setViewOrder(null);
    }
  };

  const handleSaveItem = (item) => {
    setMenuItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      return exists ? prev.map(i => i.id === item.id ? item : i) : [...prev, item];
    });
  };

  const handleDeleteItem = (id) => {
    if(window.confirm("Are you sure you want to delete this dish?")) {
      setMenuItems(prev => prev.filter(i => i.id !== id));
      setCart(prev => prev.filter(i => i.id !== id));
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

  if (isLoading) {
    return <div className={`h-screen flex items-center justify-center ${theme.bgMain} ${theme.textMain}`}>Loading System...</div>;
  }

  if (currentView === 'REPORT') {
    return <SalesReport orders={orders} history={history} onBack={() => setCurrentView('POS')} theme={theme} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`h-screen flex flex-col md:flex-row overflow-hidden font-sans transition-colors duration-200 ${theme.bgMain} ${theme.textMain}`}>
      
      {/* --- MODALS --- */}
      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        onConfirm={finalizeOrder} 
        totalPayable={grandTotal} 
        grandTotal={grandTotal} 
        selectedToken={selectedToken} 
        orderId={String(nextIdCounter).padStart(3, '0')} 
        theme={theme} 
        isDarkMode={isDarkMode} 
      />
      
      <ActiveOrdersDrawer 
        isOpen={ordersOpen} 
        onClose={() => setOrdersOpen(false)} 
        orders={orders} 
        onCompleteOrder={completeOrder} 
        theme={theme} 
        isDarkMode={isDarkMode} 
      />
      
      <OrderDetailsModal 
        order={viewOrder} 
        onClose={() => setViewOrder(null)} 
        onComplete={completeOrder} 
        theme={theme} 
      />
      
      <MenuItemModal 
        isOpen={itemModalOpen} 
        onClose={() => { setItemModalOpen(false); setEditingItem(null); }} 
        onSave={handleSaveItem} 
        onDelete={handleDeleteItem} 
        itemToEdit={editingItem} 
        theme={theme} 
        categories={CATEGORIES} 
      />
      
      <UserManagementModal 
        isOpen={userModalOpen} 
        onClose={() => setUserModalOpen(false)} 
        users={users} 
        onAddUser={handleAddUser} 
        onDeleteUser={handleDeleteUser} 
        currentUser={user} 
        theme={theme} 
      />

      {/* --- MAIN POS VIEW --- */}
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
        
        userRole={user?.role}
        userName={user?.email || user?.name}
        
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onCheckout={() => setShowCheckout(true)}
        
        onSetToken={setSelectedToken}
        onSetDiscount={setDiscount}
        onViewOrder={setViewOrder}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenReport={() => setCurrentView('REPORT')}
        
        onLogout={onLogout}
        onToggleTheme={() => setIsDarkMode(p => !p)}
        
        onAddItemClick={() => { setEditingItem(null); setItemModalOpen(true); }} 
        onEditItemClick={(item) => { setEditingItem(item); setItemModalOpen(true); }} 
        onOpenUserManagement={() => setUserModalOpen(true)}

        theme={theme}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}