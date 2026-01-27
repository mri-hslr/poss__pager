import React, { useEffect, useState, useMemo, useRef } from 'react';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import AdminSettingsModal from './AdminSettingsModal';
import { LogOut, Plus, Trash2, Edit, Save, User, Coffee, Settings, Moon, Sun } from 'lucide-react';

export default function RestaurantVendorUI({ user, onLogout, isDarkMode, onToggleTheme }) {
  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("auth_token");
  const isMounted = useRef(false);

  // --- 1. ROBUST ROLE LOGIC (Fixes "Missing Admin" on Refresh) ---
  const getRole = () => {
      // Priority 1: Prop passed from App
      if (user?.role) return user.role;
      if (user?.user?.role) return user.user.role;
      
      // Priority 2: LocalStorage Backup (If page refreshed)
      const storedRole = localStorage.getItem("user_role");
      if (storedRole) return storedRole;

      return 'cashier'; // Default
  };
  const userRole = getRole();

  // --- STATE (Memory Only) ---
  const [rawProducts, setRawProducts] = useState([]);
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasFetched = useRef(false);

  // Cart & Token State
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState("1");
  const [orders, setOrders] = useState([]); 
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [settings, setSettings] = useState({ upiId: "aakash@okaxis", payeeName: "Aakash" });
  const [activeUpiData, setActiveUpiData] = useState(null);

  // Financials
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5); 

  // Admin State
  const [activeTab, setActiveTab] = useState('menu');
  const [usersList, setUsersList] = useState([]); // Staff list
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'cashier' });

  // --- CORE FUNCTIONS ---
  
  // Call Customer (UART)
  const handleCallCustomer = async (tokenNum) => {
      try {
        await fetch(`${API_URL}/orders/call-token`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ token: Number(tokenNum) })
        });
      } catch (e) { console.error("Call failed", e); }
  };

  // Fetch Orders
  const fetchActiveOrders = async () => {
    try {
        const res = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const serverOrders = await res.json();
            if(Array.isArray(serverOrders)) setOrders(serverOrders);
        }
    } catch (e) {}
  };

  // --- EFFECTS ---

  // 1. Initial Data Load
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    // Save role to storage so it survives refresh
    if (userRole) localStorage.setItem("user_role", userRole);

    async function loadData() {
      try {
        // Load Products
        const prodRes = await fetch(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
        if (prodRes.ok) {
          const list = await prodRes.json();
          const productList = Array.isArray(list) ? list : list.products || [];
          setRawProducts(productList);
          
          // Organize Menu
          const grouped = {};
          const cats = [];
          productList.forEach(p => {
            const cat = p.category || "General";
            if (!grouped[cat]) { grouped[cat] = []; cats.push(cat); }
            grouped[cat].push({ id: Number(p.id), name: p.name, price: Number(p.price) });
          });
          setMenu(grouped);
          setCategories(cats);
          setSelectedCategory(cats[0] || "");
        }

        // Load Settings
        const setRes = await fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
        if (setRes.ok) {
           const s = await setRes.json();
           if (s.upi_id) setSettings({ upiId: s.upi_id, payeeName: s.payee_name });
        }

        // Load Users (Admin Only)
        if (userRole === 'admin') {
           console.log("Fetching users list...");
           const userRes = await fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
           if (userRes.ok) {
               const uList = await userRes.json();
               setUsersList(uList);
           }
        }
      } catch (e) { console.error("Init Error", e); }
    }
    loadData();
  }, [token, userRole]);

  // 2. Sync Orders Loop
  useEffect(() => {
    fetchActiveOrders();
    const intervalId = setInterval(fetchActiveOrders, 3000);
    return () => clearInterval(intervalId);
  }, [token]);

  // --- ADMIN ACTIONS ---
  const refreshData = () => { hasFetched.current = false; window.location.reload(); };
  const handleAdminSaveProduct = async (id) => { await fetch(`${API_URL}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editForm) }); refreshData(); };
  const handleAdminDeleteProduct = async (id) => { if(!confirm("Delete?")) return; await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); refreshData(); };
  const handleAdminAddProduct = async () => { await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(newItem) }); refreshData(); };
  const handleAdminAddUser = async () => { const res = await fetch(`${API_URL}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) }); if(res.ok) { alert("Created"); refreshData(); } else alert("Failed"); };
  const handleAdminDeleteUser = async (id) => { if(!confirm("Delete User?")) return; await fetch(`${API_URL}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); refreshData(); };

  // --- POS LOGIC ---
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const afterDiscount = Math.max(0, cartSubtotal - Number(discount));
  const taxAmount = afterDiscount * (taxRate / 100);
  const grandTotal = Math.round(afterDiscount + taxAmount);

  const availableTokens = useMemo(() => {
    const used = orders.map(o => String(o.token));
    return Array.from({ length: 50 }, (_, i) => String(i + 1)).filter(t => !used.includes(t));
  }, [orders]);

  const addToCart = item => setCart(p => { const f = p.find(i => i.id === item.id); return f ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...p, { ...item, quantity: 1 }]; });
  const removeFromCart = item => setCart(prev => { const existing = prev.find(i => i.id === item.id); if (!existing) return prev; if (existing.quantity === 1) return prev.filter(i => i.id !== item.id); return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i); });

  const finalizeOrder = async (paymentData) => {
    const tokenToUse = Number(selectedToken);
    if (!tokenToUse || isNaN(tokenToUse)) { alert("Invalid Token!"); return; }
    if (orders.some(o => o.token === tokenToUse)) { alert(`Token ${tokenToUse} taken.`); return; }

    let method = typeof paymentData === 'string' ? paymentData : paymentData?.paymentMethod;
    const payload = {
      paymentMethod: method.toLowerCase(),
      token: tokenToUse,
      items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      financials: { subtotal: cartSubtotal, discount: Number(discount), taxRate, taxAmount, finalPayable: grandTotal }
    };

    try {
      const res = await fetch(`${API_URL}/orders`, { 
          method: "POST", 
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
          body: JSON.stringify(payload) 
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed");

      if (method.toLowerCase() === 'upi' && result.upi?.qr) {
          setActiveUpiData(result.upi);
      } else {
          setOrders(p => [...p, { id: result.orderId || Date.now(), token: selectedToken, items: cart, startedAt: Date.now() }]);
          setCart([]); setDiscount(0); setShowCheckout(false); setActiveUpiData(null);
          fetchActiveOrders();
      }
    } catch (e) { alert(e.message); setShowCheckout(false); }
  };

  const handleMarkReady = async (orderId) => {
    if(!confirm("Mark done?")) return;
    try {
        await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setOrders(prev => prev.filter(o => o.id !== orderId));
        fetchActiveOrders();
    } catch (e) { console.error("Mark ready failed", e); }
  };

  // ------------------------------------------------------------------
  // 🔴 ADMIN VIEW (SIDEBAR FIXED)
  // ------------------------------------------------------------------
  if (userRole === 'admin') {
    return (
        <div className={`h-screen flex font-sans overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
            {/* SIDEBAR */}
            <div className={`w-64 flex flex-col p-6 border-r z-20 shadow-xl ${isDarkMode ? 'bg-black border-slate-800' : 'bg-white border-slate-200'}`}>
                <h1 className="text-2xl font-black mb-8 flex items-center gap-2 text-blue-600"><Settings /> Admin Panel</h1>
                
                <nav className="flex-1 space-y-2 overflow-y-auto">
                    <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        <Coffee size={20}/> Menu
                    </button>
                    {/* ✅ USERS BUTTON */}
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        <User size={20}/> Staff
                    </button>
                    <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                        <Settings size={20}/> Settings
                    </button>
                </nav>

                <div className="mt-auto pt-4 border-t border-slate-700/50 space-y-2">
                    {/* ✅ THEME BUTTON */}
                    <button onClick={onToggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${isDarkMode ? 'text-yellow-400 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {isDarkMode ? <><Sun size={20}/> Light Mode</> : <><Moon size={20}/> Dark Mode</>}
                    </button>
                    {/* ✅ LOGOUT BUTTON */}
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                        <LogOut size={20}/> Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-8 overflow-y-auto relative">
                
                {/* MENU TAB */}
                {activeTab === 'menu' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-black">Menu Management</h2>
                            <button onClick={() => setIsAddingItem(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex gap-2 hover:bg-blue-500 shadow-lg shadow-blue-500/30"><Plus size={20}/> Add Item</button>
                        </div>
                        
                        {isAddingItem && (
                            <div className={`p-6 rounded-2xl shadow-lg mb-6 border animate-in fade-in zoom-in-95 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <h3 className="font-bold mb-4">New Product</h3>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <input placeholder="Name (e.g. Burger)" className={`border p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                                    <input placeholder="Price (e.g. 150)" type="number" className={`border p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                                    <input placeholder="Category (e.g. Food)" className={`border p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setIsAddingItem(false)} className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                                    <button onClick={handleAdminAddProduct} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-500">Save Product</button>
                                </div>
                            </div>
                        )}

                        <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <table className="w-full text-left">
                                <thead className={`border-b ${isDarkMode ? 'bg-slate-700/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    <tr><th className="p-4 pl-6">Name</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4 text-right pr-6">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {rawProducts.map(p => (
                                        <tr key={p.id} className={`border-b transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <td className="p-4 pl-6 font-bold">{p.name}</td>
                                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{p.category}</span></td>
                                            <td className="p-4 font-mono text-blue-500 font-bold">₹{p.price}</td>
                                            <td className="p-4 text-right pr-6">
                                                <button onClick={() => handleAdminDeleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-black mb-8">Staff Management</h2>
                        
                        {/* Add User Form */}
                        <div className={`p-6 rounded-2xl shadow-sm border mb-8 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="text-blue-500"/> Add New User</h3>
                            <div className="grid grid-cols-4 gap-4 items-end">
                                <div className="col-span-1">
                                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Email</label>
                                    <input className={`w-full border p-2.5 rounded-lg font-bold ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Password</label>
                                    <input className={`w-full border p-2.5 rounded-lg font-bold ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Role</label>
                                    <select className={`w-full border p-2.5 rounded-lg font-bold ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                        <option value="cashier">Cashier</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <button onClick={handleAdminAddUser} className="col-span-1 bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30">Create Account</button>
                            </div>
                        </div>

                        {/* Users List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {usersList.length === 0 ? (
                                <div className="col-span-2 text-center py-10 opacity-50 border-2 border-dashed rounded-xl">No staff accounts found.</div>
                            ) : (
                                usersList.map(u => (
                                    <div key={u.id} className={`p-5 rounded-2xl border flex justify-between items-center group ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-blue-300'} transition-all`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                                <User size={24}/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{u.email}</p>
                                                <p className="text-xs font-black uppercase tracking-wider opacity-50">{u.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleAdminDeleteUser(u.id)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={20}/>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            <AdminSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
  }

  // ------------------------------------------------------------------
  // 🟢 CASHIER VIEW
  // ------------------------------------------------------------------
  return (
    <div className={`h-screen overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="flex-1 overflow-hidden relative">
          <CheckoutModal 
            isOpen={showCheckout} 
            onClose={() => { setShowCheckout(false); setActiveUpiData(null); }} 
            onConfirm={finalizeOrder} 
            onSuccess={() => handleOrderSuccess()} 
            cartSubtotal={cartSubtotal} 
            taxAmount={taxAmount} 
            discount={discount} 
            grandTotal={grandTotal} 
            orderId={orders.length + 1} 
            isDarkMode={isDarkMode} 
            upiId={settings.upiId} 
            payeeName={settings.payeeName} 
            backendUpiData={activeUpiData} 
          />
          <AdminSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
            onCheckout={() => setShowCheckout(true)} 
            onLogout={onLogout} 
            userRole={userRole} 
            isDarkMode={isDarkMode} 
            onToggleTheme={onToggleTheme}
            discount={discount} 
            setDiscount={setDiscount}
            taxRate={taxRate}
            onOpenSettings={() => setSettingsOpen(true)}
            onMarkReady={handleMarkReady} 
            onCallCustomer={handleCallCustomer} 
          />
      </div>
    </div>
  );
}