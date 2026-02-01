import React, { useEffect, useState, useMemo, useRef } from 'react';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import SalesReport from './SalesReport'; 
import AdminSettingsModal from './AdminSettingsModal';
import ActiveOrdersDrawer from './ActiveOrdersDrawer'; 
import { LogOut, Plus, Trash2, User, Coffee, Settings, Moon, Sun, LayoutDashboard, X as XIcon, ChevronDown, Box } from 'lucide-react';

export default function RestaurantVendorUI({ 
  user, 
  onLogout, 
  isDarkMode, 
  onToggleTheme, 
  API_URL = "http://localhost:5000" 
}) {
  
  const token = localStorage.getItem("auth_token");
  
  // --- STATE ---
  const [dockConnected, setDockConnected] = useState(false);
  const [rawProducts, setRawProducts] = useState([]); 
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [history, setHistory] = useState([]); // <--- This needs to update instantly!
  const [usersList, setUsersList] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(false); 
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5); 
  const [settings, setSettings] = useState({ upiId: "example@upi", payeeName: "Merchant" });
  const [activeUpiData, setActiveUpiData] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', stock: '' });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'cashier' });
  
  const hasFetched = useRef(false);
  
  const getRestaurantId = () => user?.restaurantId || user?.user?.restaurantId || user?.restaurant_id || 1;
  const getRole = () => user?.role || user?.user?.role || localStorage.getItem("user_role") || 'cashier';
  const userRole = getRole();

  // --- API ---
  const refreshProducts = async () => {
      try {
        const rId = getRestaurantId();
        const prodRes = await fetch(`${API_URL}/products?restaurantId=${rId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (prodRes.ok) {
            const list = await prodRes.json();
            const productList = Array.isArray(list) ? list : list.products || [];
            setRawProducts(productList);
            const grouped = {};
            const cats = new Set();
            productList.forEach(p => {
                const cat = p.category || "General";
                if (!grouped[cat]) { grouped[cat] = []; }
                cats.add(cat);
                grouped[cat].push({ 
                    id: Number(p.id), 
                    name: p.name, 
                    price: Number(p.price),
                    stock: p.stock
                });
            });
            setMenu(grouped);
            setCategories(Array.from(cats));
        }
      } catch (e) { console.error(e); }
  };

  // ✅ NEW FUNCTION: Fetch Sales History
  const fetchHistory = async () => {
    try {
        const res = await fetch(`${API_URL}/orders/history`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const hist = await res.json();
            setHistory(hist);
        }
    } catch (e) { console.error("History fetch failed", e); }
  };

  const refreshUsers = async () => {
      try {
        const userRes = await fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
        if (userRes.ok) setUsersList(await userRes.json());
      } catch (e) { console.error(e); }
  };

  const fetchActiveOrders = async () => {
    try {
        const res = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { localStorage.removeItem("auth_token"); window.location.reload(); return; }
        if (res.ok) {
            const serverOrders = await res.json();
            if(Array.isArray(serverOrders)) {
                setOrders(serverOrders.map(o => ({
                    ...o,
                    startedAt: o.startedAt || o.created_at || Date.now(), 
                    paymentMethod: (o.paymentMethod || o.payment_method || 'cash').toLowerCase(),
                    total: Number(o.total || o.total_amount || 0),
                    items: o.items || []
                })));
            }
        }
    } catch (e) {}
  };

  // --- INIT ---
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (userRole) localStorage.setItem("user_role", userRole);
    async function loadData() {
      await refreshProducts(); 
      await fetchActiveOrders();
      await fetchHistory(); // ✅ Load history on startup
      try {
        const setRes = await fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
        if (setRes.ok) { const s = await setRes.json(); if (s.upi_id) setSettings({ upiId: s.upi_id, payeeName: s.payee_name }); }
        if (userRole === 'admin') await refreshUsers(); 
      } catch (e) { console.error(e); }
    }
    loadData();
  }, [token, userRole, API_URL]);

  useEffect(() => {
    const intervalId = setInterval(fetchActiveOrders, 3000);
    return () => clearInterval(intervalId);
  }, [token, API_URL]);

  // --- HANDLERS ---
  const handleAdminDeleteProduct = async (id) => { if(!confirm("Delete?")) return; await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); refreshProducts(); };
  
  const handleAdminAddProduct = async () => { 
      const rId = getRestaurantId();
      const productPayload = { ...newItem, stock: newItem.stock || 0, restaurantId: rId };
      await fetch(`${API_URL}/products`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify(productPayload) 
      }); 
      setNewItem({ name: '', price: '', category: '', stock: '' }); 
      setIsAddingItem(false); 
      setIsCreatingCategory(false); 
      refreshProducts(); 
  };
  
  const handleAdminDeleteUser = async (id) => { if(!confirm("Delete?")) return; try { const res = await fetch(`${API_URL}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if(res.ok) setUsersList(prev => prev.filter(u => u.id !== id)); } catch(e) {} };
  
  const handleAdminAddUser = async () => { 
      if(!newUser.username || !newUser.email || !newUser.password) return alert("Fill all fields"); 
      const rId = getRestaurantId(); 
      await fetch(`${API_URL}/auth/signup`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...newUser, restaurantId: rId }) 
      }); 
      setNewUser({ username: '', email: '', password: '', role: 'cashier' }); 
      refreshUsers(); 
  };

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const afterDiscount = Math.max(0, cartSubtotal - Number(discount));
  const taxAmount = afterDiscount * (taxRate / 100);
  const grandTotal = Math.round(afterDiscount + taxAmount);

  const availableTokens = useMemo(() => {
    const used = orders.map(o => String(o.token));
    return Array.from({ length: 50 }, (_, i) => String(i + 1)).filter(t => !used.includes(t));
  }, [orders]);

  useEffect(() => { if (availableTokens.length > 0 && !availableTokens.includes(selectedToken)) setSelectedToken(availableTokens[0]); }, [availableTokens, selectedToken]);

  const addToCart = item => setCart(p => { const f = p.find(i => i.id === item.id); return f ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...p, { ...item, quantity: 1 }]; });
  const removeFromCart = item => setCart(prev => { const existing = prev.find(i => i.id === item.id); if (!existing) return prev; if (existing.quantity === 1) return prev.filter(i => i.id !== item.id); return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i); });

  const handleCheckoutClick = () => { if (cart.length === 0) return alert("Cart is empty"); if (dockConnected) sendToDock(selectedToken); setShowCheckout(true); };

  const finalizeOrder = async (paymentData) => {
    const tokenToUse = Number(selectedToken);
    let method = 'cash';
    if (paymentData && typeof paymentData === 'object' && paymentData.paymentMethod) method = paymentData.paymentMethod.toLowerCase();
    else if (typeof paymentData === 'string') method = paymentData.toLowerCase();
    const rId = getRestaurantId(); 
    const financials = { subtotal: cartSubtotal, discount: Number(discount), taxAmount: taxAmount, finalPayable: grandTotal };
    const payload = {
      restaurantId: rId, paymentMethod: method, token: tokenToUse,
      items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      financials: financials 
    };
    try {
      const res = await fetch(`${API_URL}/orders`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed");
      if (method === 'upi' && result.upi?.qr) {
          setActiveUpiData(result.upi);
      } else {
          const newOrder = { 
              id: result.orderId || Date.now(), token: selectedToken, items: [...cart], startedAt: Date.now(),
              total: grandTotal, paymentMethod: method, discount: Number(discount), tax: taxAmount, financials: financials 
          };
          setOrders(p => [...p, newOrder]);
          // Instant update for checkout
          setHistory(prev => [{ ...newOrder, status: 'paid', activeDate: new Date().toISOString() }, ...prev]); 
          setCart([]); setDiscount(0); setShowCheckout(false); setActiveUpiData(null);
          setTimeout(fetchActiveOrders, 500);
      }
    } catch (e) { alert(e.message); setShowCheckout(false); }
  };

  // ✅ THIS IS THE CRITICAL FIX FOR INSTANT SALES REPORT UPDATE
  const handleMarkReady = async (orderId) => { 
    if (!confirm("Mark order as ready?")) return;

    // 1. Find the order data before we remove it
    const completedOrder = orders.find(o => String(o.id) === String(orderId));

    // 2. Optimistic Update: Remove from Active Orders
    setOrders(prev => prev.filter(o => String(o.id) !== String(orderId)));

    // 3. Optimistic Update: Add to Sales History INSTANTLY
    if (completedOrder) {
        setHistory(prev => [
            { 
                ...completedOrder, 
                status: 'paid', 
                activeDate: new Date().toISOString(), // Use current time for report
                payment_status: 'paid' 
            }, 
            ...prev
        ]);
    }

    try { 
      // 4. Send update to database
      const res = await fetch(`${API_URL}/orders/${orderId}/complete`, { 
          method: 'PUT', 
          headers: { Authorization: `Bearer ${token}` } 
      }); 

      if (!res.ok) {
         console.warn("Update failed");
         fetchActiveOrders(); // Revert on failure
      } else {
         // Optional: Fetch fresh history in background to be 100% synced
         fetchHistory();
      }
    } catch (e) { 
      console.error("Completion failed", e);
    }
  };
  
  const connectDock = async () => {};
  const sendToDock = async (tokenNum) => {};

  if (userRole === 'admin') {
    return (
        <div className={`h-screen flex font-sans overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
            <div className={`w-64 flex flex-col p-6 border-r z-20 shadow-xl ${isDarkMode ? 'bg-black border-slate-800' : 'bg-white border-slate-200'}`}>
                <h1 className="text-2xl font-black mb-8 flex items-center gap-2 text-blue-600"><Settings className="animate-spin-slow" /> Admin</h1>
                <nav className="flex-1 space-y-3 overflow-y-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all outline-none ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}><LayoutDashboard size={20}/> Dashboard</button>
                    <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all outline-none ${activeTab === 'menu' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}><Coffee size={20}/> Menu</button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all outline-none ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}><User size={20}/> Staff</button>
                    <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 outline-none transition-colors"><Settings size={20}/> Settings</button>
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-700/50 space-y-3">
                    <button onClick={onToggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold outline-none transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>{isDarkMode ? <><Sun size={20}/> Light Mode</> : <><Moon size={20}/> Dark Mode</>}</button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl outline-none transition-colors"><LogOut size={20}/> Logout</button>
                </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto relative">
                {activeTab === 'dashboard' && (<SalesReport orders={orders} history={history} products={rawProducts} isDarkMode={isDarkMode} />)}
                {activeTab === 'menu' && (
                    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-black">Menu</h2><button onClick={() => setIsAddingItem(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex gap-2 hover:bg-blue-500 shadow-lg shadow-blue-500/30 outline-none"><Plus size={20}/> Add Item</button></div>
                        {isAddingItem && (
                            <div className={`p-6 rounded-2xl shadow-lg mb-6 border animate-in fade-in zoom-in-95 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    <input placeholder="Name" className={`border p-3 rounded-xl font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                                    <input placeholder="Price (₹)" type="number" className={`border p-3 rounded-xl font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                                    <input placeholder="Stock Qty" type="number" className={`border p-3 rounded-xl font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} />
                                    <div className="relative">
                                        {isCreatingCategory ? (
                                            <div className="flex gap-2">
                                                <input placeholder="New Category Name" className={`border p-3 rounded-xl font-bold outline-none focus:border-blue-500 flex-1 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} autoFocus />
                                                <button onClick={() => { setIsCreatingCategory(false); setNewItem({...newItem, category: ''}) }} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><XIcon size={20} /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select className={`w-full border p-3 rounded-xl font-bold outline-none appearance-none focus:border-blue-500 cursor-pointer ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.category} onChange={(e) => { if (e.target.value === '__NEW__') { setIsCreatingCategory(true); setNewItem({...newItem, category: ''}); } else { setNewItem({...newItem, category: e.target.value}); } }}>
                                                    <option value="" disabled>Select Category</option>
                                                    {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                                                    <option value="__NEW__" className="font-bold text-blue-500">+ Add New Category</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={16} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end"><button onClick={() => { setIsAddingItem(false); setIsCreatingCategory(false); }} className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 outline-none">Cancel</button><button onClick={handleAdminAddProduct} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-500 outline-none">Save Product</button></div>
                            </div>
                        )}
                        <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <table className="w-full text-left">
                                <thead className={`border-b ${isDarkMode ? 'bg-slate-700/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    <tr><th className="p-4 pl-6">Name</th><th className="p-4">Category</th><th className="p-4">Stock</th><th className="p-4">Price</th><th className="p-4 text-right pr-6">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {rawProducts.map(p => (
                                        <tr key={p.id} className={`border-b transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <td className="p-4 pl-6 font-bold">{p.name}</td>
                                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{p.category}</span></td>
                                            <td className="p-4 font-bold flex items-center gap-2"><Box size={16} className="opacity-50"/> {p.stock}</td>
                                            <td className="p-4 font-mono text-blue-500 font-bold">₹{p.price}</td>
                                            <td className="p-4 text-right pr-6"><button onClick={() => handleAdminDeleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors outline-none"><Trash2 size={18}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-black mb-8">Staff</h2>
                        <div className={`p-6 rounded-2xl shadow-sm border mb-8 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="text-blue-500"/> Add User</h3>
                            <div className="grid grid-cols-4 gap-4 items-end">
                                <div className="col-span-1"><label className="text-xs font-bold uppercase opacity-50 mb-1 block">Username</label><input className={`w-full border p-2.5 rounded-lg font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="john_doe"/></div>
                                <div className="col-span-1"><label className="text-xs font-bold uppercase opacity-50 mb-1 block">Email</label><input className={`w-full border p-2.5 rounded-lg font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@pos.com"/></div>
                                <div className="col-span-1"><label className="text-xs font-bold uppercase opacity-50 mb-1 block">Password</label><input className={`w-full border p-2.5 rounded-lg font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••"/></div>
                                <div className="col-span-1 flex gap-2"><div className="flex-1"><label className="text-xs font-bold uppercase opacity-50 mb-1 block">Role</label><select className={`w-full border p-2.5 rounded-lg font-bold outline-none focus:border-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div><button onClick={handleAdminAddUser} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 outline-none mt-auto">Create</button></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{usersList.map(u => (<div key={u.id} className={`p-5 rounded-2xl border flex justify-between items-center group ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-blue-300'} transition-all`}><div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><User size={24}/></div><div><p className="font-bold text-lg">{u.username || u.email.split('@')[0]}</p><p className="text-xs font-black uppercase tracking-wider opacity-50">{u.role}</p><p className="text-xs opacity-30">{u.email}</p></div></div><button onClick={() => handleAdminDeleteUser(u.id)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all outline-none"><Trash2 size={20}/></button></div>))}</div>
                    </div>
                )}
            </div>
            <AdminSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} API_URL={API_URL} />
        </div>
    );
  }

  // --- CASHIER UI ---
  return (
    <div className={`h-screen overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="flex-1 overflow-hidden relative">
          <CheckoutModal isOpen={showCheckout} onClose={() => { setShowCheckout(false); setActiveUpiData(null); }} onConfirm={finalizeOrder} cartSubtotal={cartSubtotal} taxAmount={taxAmount} discount={discount} grandTotal={grandTotal} orderId={orders.length + 1} isDarkMode={isDarkMode} upiId={settings.upiId} payeeName={settings.payeeName} backendUpiData={activeUpiData} />
          
          <ActiveOrdersDrawer 
            isOpen={showActiveOrders} 
            onClose={() => setShowActiveOrders(false)} 
            orders={orders} 
            onCompleteOrder={handleMarkReady} 
            isDarkMode={isDarkMode} 
          />
          
          <AdminSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} API_URL={API_URL} />
          
          <POSView 
            menu={menu} 
            categories={categories} 
            cart={cart} 
            orders={orders} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
            availableTokens={availableTokens} 
            selectedToken={selectedToken} 
            onSetToken={setSelectedToken} 
            onAddToCart={addToCart} 
            onRemoveFromCart={removeFromCart} 
            onCheckout={handleCheckoutClick} 
            onLogout={onLogout} 
            userRole={userRole} 
            isDarkMode={isDarkMode} 
            onToggleTheme={onToggleTheme} 
            discount={discount} 
            setDiscount={setDiscount} 
            taxRate={taxRate} 
            onOpenSettings={() => setSettingsOpen(true)} 
            onOpenActiveOrders={() => setShowActiveOrders(true)}
            onMarkReady={handleMarkReady} 
            onCallCustomer={(t) => sendToDock(t)} 
            onConnectDock={connectDock} 
            dockConnected={dockConnected} 
          />
      </div>
    </div>
  );
}