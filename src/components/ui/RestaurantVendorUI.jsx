import React, { useEffect, useState, useMemo, useRef } from 'react';
import { LogOut, Plus, Trash2, Edit, Save, X, User, Coffee, Settings, Moon, Sun } from 'lucide-react';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import AdminSettingsModal from './AdminSettingsModal';

export default function RestaurantVendorUI({ user, onLogout, isDarkMode, onToggleTheme }) {
  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("auth_token");
  const isMounted = useRef(false); // Used to prevent ESP ping on initial page load

  // --- ROLE LOGIC ---
  const findRoleInObject = (obj) => {
      if (!obj) return null;
      if (typeof obj !== 'object') return null;
      if (obj.role) return obj.role;
      if (obj.user && obj.user.role) return obj.user.role;
      return null;
  };
  let userRole = findRoleInObject(user) || 'cashier';
  if (userRole === 'manager') userRole = 'cashier';

  // --- STATE ---
  const [rawProducts, setRawProducts] = useState([]);
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasFetched = useRef(false);

  // Cart Persistence
  const [cart, setCart] = useState(() => {
      try { const s = localStorage.getItem("pos_cart"); return s ? JSON.parse(s) : []; } catch (e) { return []; }
  });

  // Token Persistence
  const [selectedToken, setSelectedToken] = useState(() => {
      return localStorage.getItem("pos_selected_token") || "1";
  });

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
  const [usersList, setUsersList] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'cashier' });

  // --- PERSISTENCE EFFECT ---
  useEffect(() => { localStorage.setItem("pos_cart", JSON.stringify(cart)); }, [cart]);
  
  // --- CORE FUNCTIONS (Defined early to be used in effects) ---
  
  // 1. Call Customer (UART Ping)
  const handleCallCustomer = async (tokenNum) => {
      try {
        await fetch(`${API_URL}/orders/call-token`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ token: Number(tokenNum) })
        });
        console.log(`Signal sent for Token ${tokenNum}`);
      } catch (e) { console.error("Call failed", e); }
  };

  // 2. Fetch Active Orders (Kitchen View Sync)
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

  // 1. Auto-Ping ESP32 when Token Selector Changes
  useEffect(() => { 
      localStorage.setItem("pos_selected_token", selectedToken); 
      
      // Prevent running on initial page load (so it doesn't beep just by refreshing)
      if (!isMounted.current) {
          isMounted.current = true;
          return;
      }

      // Debounce: Wait 500ms after user stops changing token before pinging
      const timer = setTimeout(() => {
          handleCallCustomer(selectedToken); 
      }, 500);

      return () => clearTimeout(timer);
  }, [selectedToken]);

  // 2. Initial Data Load (Menu, Settings, Users)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    async function loadData() {
      try {
        const prodRes = await fetch(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
        if (prodRes.ok) {
          const list = await prodRes.json();
          const productList = Array.isArray(list) ? list : list.products || [];
          setRawProducts(productList);
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
        const setRes = await fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
        if (setRes.ok) {
           const s = await setRes.json();
           if (s.upi_id) setSettings({ upiId: s.upi_id, payeeName: s.payee_name });
        }
        if (userRole === 'admin') {
           const userRes = await fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
           if (userRes.ok) setUsersList(await userRes.json());
        }
      } catch (e) { console.error("Init Error", e); }
    }
    loadData();
  }, [token, userRole]);

  // 3. Sync Orders Loop
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
  const handleAdminDeleteUser = async (id) => { if(id === user.id) return alert("No self-delete"); if(!confirm("Delete?")) return; await fetch(`${API_URL}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); refreshData(); };

  // --- POS CALCULATIONS ---
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const afterDiscount = Math.max(0, cartSubtotal - Number(discount));
  const taxAmount = afterDiscount * (taxRate / 100);
  const grandTotal = Math.round(afterDiscount + taxAmount);

  const availableTokens = useMemo(() => {
    const used = orders.map(o => String(o.token));
    return Array.from({ length: 50 }, (_, i) => String(i + 1)).filter(t => !used.includes(t));
  }, [orders]);

  // Auto-switch token if current one gets taken
  useEffect(() => {
    if (availableTokens.length > 0 && !availableTokens.includes(selectedToken)) {
        setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  const addToCart = item => setCart(p => { const f = p.find(i => i.id === item.id); return f ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...p, { ...item, quantity: 1 }]; });
  const removeFromCart = item => setCart(prev => { const existing = prev.find(i => i.id === item.id); if (!existing) return prev; if (existing.quantity === 1) return prev.filter(i => i.id !== item.id); return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i); });


  // --- CHECKOUT LOGIC (Fixes "Stuck on Generating") ---
  const finalizeOrder = async (paymentData) => {
    const tokenToUse = Number(selectedToken);
    
    // Validation
    if (!tokenToUse || isNaN(tokenToUse)) {
        alert("Invalid Token! Please select a token first.");
        return;
    }
    const isTokenTaken = orders.some(o => o.token === tokenToUse);
    if (isTokenTaken) {
        alert(`Token ${tokenToUse} is already active! Please pick another.`);
        return;
    }

    let method = typeof paymentData === 'string' ? paymentData : paymentData?.paymentMethod;
    
    const payload = {
      paymentMethod: method.toLowerCase(),
      token: tokenToUse,
      items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      financials: { subtotal: cartSubtotal, discount: Number(discount), taxRate, taxAmount, finalPayable: grandTotal }
    };

    console.log("Sending Order Payload:", payload);

    try {
      const res = await fetch(`${API_URL}/orders`, { 
          method: "POST", 
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
          body: JSON.stringify(payload) 
      });
      
      const result = await res.json();
      
      if (!res.ok) {
          throw new Error(result.message || "Payment Failed");
      }

      // Handle Success Response
      if (method.toLowerCase() === 'upi' && result.upi?.qr) {
          setActiveUpiData(result.upi); // Keep modal open for UPI QR
      } else {
          handleOrderSuccess(result.orderId); // Close modal immediately for Cash/Card
      }

    } catch (e) { 
        console.error("Order failed:", e); 
        alert(`Order Failed: ${e.message}`);
        setShowCheckout(false); // Force close modal on error to prevent stuck state
    }
  };

  const handleOrderSuccess = (orderId) => {
    // Optimistic Update
    setOrders(p => [...p, { id: orderId || Date.now(), token: selectedToken, items: cart, startedAt: Date.now() }]);
    setCart([]); setDiscount(0); setShowCheckout(false); setActiveUpiData(null);
    localStorage.removeItem("pos_cart"); 
    fetchActiveOrders(); 
  };

  const handleMarkReady = async (orderId) => {
    if(!confirm("Mark this order as completed?")) return;
    try {
        await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setOrders(prev => prev.filter(o => o.id !== orderId));
        fetchActiveOrders();
    } catch (e) { console.error("Mark ready failed", e); }
  };


  // --- RENDER ---
  const bgMain = isDarkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900";
  const bgCard = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const bgInput = isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const tableHeader = isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500";
  const tableRow = isDarkMode ? "hover:bg-slate-800/50 border-slate-700" : "hover:bg-slate-50 border-slate-200";

  if (userRole === 'admin') {
    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-300 ${bgMain}`}>
            <div className="flex flex-1 overflow-hidden">
                <div className={`w-64 flex flex-col p-6 ${isDarkMode ? 'bg-black border-r border-slate-800' : 'bg-slate-900'} text-white`}>
                    <h1 className="text-2xl font-black mb-10 flex items-center gap-2"><Settings className="text-blue-500" /> Admin</h1>
                    <nav className="flex-1 space-y-2">
                        <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}><Coffee size={20}/> Menu</button>
                        <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}><User size={20}/> Staff</button>
                        <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/10"><Settings size={20}/> Settings</button>
                    </nav>
                    <button onClick={onToggleTheme} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-yellow-400 hover:bg-white/10 mb-2">{isDarkMode ? <><Sun size={20}/> Light Mode</> : <><Moon size={20}/> Dark Mode</>}</button>
                    <button onClick={onLogout} className="flex items-center gap-2 text-red-400 font-bold mt-auto px-4 py-2 hover:bg-white/10 rounded-lg"><LogOut size={18}/> Logout</button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'menu' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-black">Menu</h2><button onClick={() => setIsAddingItem(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex gap-2"><Plus size={20}/> Add</button></div>
                            {isAddingItem && (<div className={`p-6 rounded-2xl shadow-lg mb-6 border ${bgCard}`}><div className="grid grid-cols-3 gap-4 mb-4"><input placeholder="Name" className={`border p-3 rounded-xl ${bgInput}`} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} /><input placeholder="Price" className={`border p-3 rounded-xl ${bgInput}`} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} /><input placeholder="Category" className={`border p-3 rounded-xl ${bgInput}`} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} /></div><div className="flex gap-2 justify-end"><button onClick={() => setIsAddingItem(false)} className={`px-4 py-2 rounded-lg font-bold ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>Cancel</button><button onClick={handleAdminAddProduct} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Save</button></div></div>)}
                            <div className={`rounded-2xl shadow-sm border overflow-hidden ${bgCard}`}><table className="w-full text-left"><thead className={`border-b ${tableHeader}`}><tr><th className="p-4">Name</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{rawProducts.map(p => (<tr key={p.id} className={`border-b ${tableRow}`}>{editingId === p.id ? (<><td className="p-4"><input className={`border p-1 w-full rounded ${bgInput}`} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></td><td className="p-4"><input className={`border p-1 w-full rounded ${bgInput}`} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}/></td><td className="p-4"><input className={`border p-1 w-full rounded ${bgInput}`} value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})}/></td><td className="p-4 text-right"><button onClick={() => handleAdminSaveProduct(p.id)} className="text-green-500 mr-2"><Save/></button><button onClick={() => setEditingId(null)} className="text-slate-400"><X/></button></td></>) : (<><td className="p-4 font-bold">{p.name}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{p.category}</span></td><td className="p-4">₹{p.price}</td><td className="p-4 text-right"><button onClick={() => { setEditingId(p.id); setEditForm(p); }} className="text-blue-500 mr-2 hover:bg-blue-500/10 p-2 rounded"><Edit/></button><button onClick={() => handleAdminDeleteProduct(p.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2/></button></td></>)}</tr>))}</tbody></table></div>
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-3xl font-black mb-6">Staff</h2>
                            <div className={`p-6 rounded-2xl shadow-sm border mb-8 ${bgCard}`}><div className="grid grid-cols-4 gap-4 items-end"><div><label className={`text-xs font-bold ${textSub}`}>Email</label><input className={`w-full border p-2 rounded ${bgInput}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div><div><label className={`text-xs font-bold ${textSub}`}>Password</label><input className={`w-full border p-2 rounded ${bgInput}`} type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div><div><label className={`text-xs font-bold ${textSub}`}>Role</label><select className={`w-full border p-2 rounded ${bgInput}`} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div><button onClick={handleAdminAddUser} className="bg-blue-600 text-white p-2 rounded font-bold">Create</button></div></div>
                            <div className="grid grid-cols-3 gap-4">{usersList.map(u => (<div key={u.id} className={`p-5 rounded-2xl border flex justify-between items-center ${bgCard}`}><div className="flex items-center gap-4"><div className="bg-blue-500/10 p-3 rounded-full text-blue-500"><User size={20}/></div><div><p className="font-bold">{u.email}</p><p className={`text-xs font-black uppercase ${textSub}`}>{u.role}</p></div></div><button onClick={() => handleAdminDeleteUser(u.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><Trash2 size={20}/></button></div>))}</div>
                        </div>
                    )}
                </div>
                <AdminSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
            </div>
        </div>
    );
  }

  // --- CASHIER VIEW ---
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