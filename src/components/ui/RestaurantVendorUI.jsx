import React, { useEffect, useState, useMemo, useRef } from 'react';
import { LogOut, LayoutDashboard, Coffee, Settings, User, Sun, Moon, Bell, Plus, Trash2, Box, ChevronDown, X as XIcon } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import SalesReport from './SalesReport';
import AdminSettingsModal from './AdminSettingsModal';
import ActiveOrdersDrawer from './ActiveOrdersDrawer';

export default function RestaurantVendorUI({ user, onLogout, isDarkMode, onToggleTheme, API_URL = "http://localhost:3000" }) {
  const theme = getTheme(isDarkMode);
  const token = localStorage.getItem("auth_token");

  // Helpers
  const getRestaurantId = () => user?.restaurantId || user?.user?.restaurantId || user?.restaurant_id || 1;
  const getUserRole = () => user?.role || user?.user?.role || localStorage.getItem("user_role") || 'cashier';
  const userRole = getUserRole();

  // --- STATE ---
  const [orders, setOrders] = useState([]); 
  const [history, setHistory] = useState([]); 
  const [rawProducts, setRawProducts] = useState([]); 
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [showActiveOrders, setShowActiveOrders] = useState(false); 
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'dashboard' : 'menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [dockConnected, setDockConnected] = useState(false);

  // Admin State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', stock: '' });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'cashier' });

  // POS Logic
  const [selectedToken, setSelectedToken] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5); 
  const [settings, setSettings] = useState({ upiId: "", payeeName: "" });
  const [activeUpiData, setActiveUpiData] = useState(null);

  const hasFetched = useRef(false);
  
  // --- API ---
  const refreshProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products?restaurantId=${getRestaurantId()}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const list = await res.json();
            const productList = Array.isArray(list) ? list : list.products || [];
            setRawProducts(productList);
            const grouped = {};
            const cats = new Set();
            productList.forEach(p => {
                const cat = p.category || "General";
                if (!grouped[cat]) grouped[cat] = []; 
                cats.add(cat);
                grouped[cat].push({ id: Number(p.id), name: p.name, price: Number(p.price), stock: p.stock, category: cat });
            });
            setMenu(grouped);
            setCategories(Array.from(cats));
        }
      } catch (e) { console.error(e); }
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
        if (res.ok) {
            const serverOrders = await res.json();
            if(Array.isArray(serverOrders)) {
                setOrders(serverOrders.map(o => ({
                    ...o,
                    startedAt: o.startedAt || o.created_at || Date.now(), 
                    paymentMethod: (o.paymentMethod || o.payment_method || 'cash').toLowerCase(),
                    total: Number(o.total || 0),
                    items: o.items || []
                })));
            }
        }
    } catch (e) {}
  };

  const fetchHistory = async () => {
    try {
        const res = await fetch(`${API_URL}/orders/history`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setHistory(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const load = async () => {
       await refreshProducts(); 
       await fetchActiveOrders();
       await fetchHistory();
       try {
         const sRes = await fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
         if(sRes.ok) { const s = await sRes.json(); setSettings({ upiId: s.upi_id, payeeName: s.payee_name }); }
         if (userRole === 'admin') await refreshUsers(); 
       } catch(e){}
    };
    load();
    const interval = setInterval(fetchActiveOrders, 3000);
    return () => clearInterval(interval);
  }, [token, API_URL, userRole]);

  useEffect(() => {
    if (userRole !== 'admin' && activeTab === 'dashboard') {
        setActiveTab('menu');
    }
  }, [userRole, activeTab]);

  // --- HANDLERS ---
  const handleAdminAddProduct = async () => { 
      const rId = getRestaurantId();
      const productPayload = { ...newItem, stock: newItem.stock || 0, restaurantId: rId };
      await fetch(`${API_URL}/products`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify(productPayload) 
      }); 
      setNewItem({ name: '', price: '', category: '', stock: '' }); 
      setIsCreatingCategory(false); 
      setIsAddingItem(false); 
      refreshProducts(); 
  };

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

  const handleAdminDeleteUser = async (id) => { 
      if(!confirm("Delete User?")) return; 
      try { 
          const res = await fetch(`${API_URL}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); 
          if(res.ok) setUsersList(prev => prev.filter(u => u.id !== id)); 
      } catch(e) {} 
  };

  // --- DOCK LOGIC ---
  const connectDock = async () => {
    try {
        if ('serial' in navigator) {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            setDockConnected(true);
            alert("✅ Dock Connected Successfully!");
        } else {
            alert("⚠️ Web Serial API not supported in this browser.");
        }
    } catch (err) {
        console.error("Dock Connection Failed:", err);
        setDockConnected(false);
    }
  };

  const sendToDock = async (tokenNum) => {
    if (!dockConnected) {
        alert("Dock not connected! Please click the Connect Dock button.");
        return;
    }
    console.log(`Sending Token ${tokenNum} to Dock...`);
  };

  // Cart Logic
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = (Math.max(0, cartSubtotal - discount)) * (taxRate / 100);
  const grandTotal = Math.round((Math.max(0, cartSubtotal - discount)) + taxAmount);

  const availableTokens = useMemo(() => {
    const used = orders.map(o => String(o.token));
    return Array.from({ length: 50 }, (_, i) => String(i + 1)).filter(t => !used.includes(t));
  }, [orders]);

  useEffect(() => { if (availableTokens.length > 0 && !availableTokens.includes(selectedToken)) setSelectedToken(availableTokens[0]); }, [availableTokens, selectedToken]);

  const addToCart = item => setCart(p => { const f = p.find(i => i.id === item.id); return f ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...p, { ...item, quantity: 1 }]; });
  const removeFromCart = item => setCart(p => { const f = p.find(i => i.id === item.id); if(!f) return p; if(f.quantity === 1) return p.filter(i => i.id !== item.id); return p.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i); });

  const finalizeOrder = async (payData) => {
    let method = typeof payData === 'object' ? payData.paymentMethod : payData;
    const payload = {
      restaurantId: getRestaurantId(), paymentMethod: method, token: Number(selectedToken),
      items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      financials: { subtotal: cartSubtotal, discount, taxAmount, finalPayable: grandTotal }
    };
    try {
      const res = await fetch(`${API_URL}/orders`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message);
      
      if(dockConnected) sendToDock(selectedToken);

      if (method === 'upi' && r.upi?.qr) setActiveUpiData(r.upi);
      else {
          const newO = { id: r.orderId || Date.now(), token: selectedToken, items: [...cart], startedAt: Date.now(), total: grandTotal, status: 'paid' };
          setOrders(p => [...p, newO]);
          setHistory(p => [{...newO, activeDate: new Date().toISOString()}, ...p]);
          setCart([]); setDiscount(0); setShowCheckout(false);
          setTimeout(fetchActiveOrders, 500);
      }
    } catch (e) { alert(e.message); setShowCheckout(false); }
  };

  const handleMarkReady = async (id) => {
      if(!confirm("Complete Order?")) return;
      const finished = orders.find(o => String(o.id) === String(id));
      setOrders(p => p.filter(o => String(o.id) !== String(id)));
      if(finished) setHistory(p => [{...finished, status: 'paid', activeDate: new Date().toISOString()}, ...p]);
      await fetch(`${API_URL}/orders/${id}/complete`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      fetchActiveOrders();
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme.bg.main} ${theme.text.main}`} style={{ fontFamily: FONTS.sans }}>
      
      {/* SIDEBAR */}
      <aside className={`w-20 lg:w-64 flex flex-col p-6 border-r ${theme.border.default} ${theme.bg.card}`}>
         <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
             <div className={`p-2 rounded-xl ${theme.bg.subtle}`}>
                 <Settings size={24} />
             </div>
             <h1 className="hidden lg:block text-xl font-semibold">POSPro</h1>
         </div>

         <nav className="flex-1 space-y-1 overflow-y-auto">
             {[
               { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', role: 'admin' },
               { id: 'menu', icon: Coffee, label: 'Menu' },
               { id: 'kitchen', icon: Bell, label: 'Kitchen', role: 'cashier', action: () => setShowActiveOrders(true) }, 
               { id: 'users', icon: User, label: 'Staff', role: 'admin' },
             ].map(item => (
                (!item.role || item.role === userRole) && (
                 <button 
                    key={item.id}
                    onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none
                    ${activeTab === item.id && !item.action 
                        ? theme.bg.active + ' ' + theme.text.main
                        : theme.button.ghost
                    }`}
                 >
                    <item.icon size={18} />
                    <span className="hidden lg:block">{item.label}</span>
                    {item.id === 'kitchen' && orders.length > 0 && (
                        <span className={`hidden lg:flex ml-auto ${COMMON_STYLES.badge(isDarkMode)} text-[10px]`}>
                            {orders.length}
                        </span>
                    )}
                 </button>
                )
             ))}
             <button 
                onClick={() => setSettingsOpen(true)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none ${theme.button.ghost}`}
             >
                <Settings size={18}/>
                <span className="hidden lg:block">Settings</span>
             </button>
         </nav>

         <div className={`mt-auto pt-6 border-t space-y-1 ${theme.border.default}`}>
             <button 
                onClick={onToggleTheme} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium outline-none transition-colors ${theme.button.ghost}`}
             >
                 {isDarkMode ? <><Sun size={18}/> <span className="hidden lg:block">Light</span></> : <><Moon size={18}/> <span className="hidden lg:block">Dark</span></>}
             </button>
             <button 
                onClick={onLogout} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium outline-none transition-colors ${theme.button.ghost}`}
             >
                 <LogOut size={18} />
                 <span className="hidden lg:block">Logout</span>
             </button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex flex-col overflow-hidden ${theme.bg.main}`}>
          <header className={`h-16 flex items-center justify-between px-8 border-b ${theme.border.default} ${theme.bg.card}`}>
              <h2 className="text-xl font-semibold capitalize">
                  {activeTab === 'dashboard' ? 'Overview' : activeTab === 'menu' ? 'Menu & Orders' : activeTab}
              </h2>
              <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
                      <p className={`text-xs uppercase font-medium tracking-wider ${theme.text.tertiary}`}>{userRole}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border.default} ${theme.bg.subtle}`}>
                      <User size={16} className={theme.text.secondary}/>
                  </div>
              </div>
          </header>

          <div className="flex-1 overflow-y-auto p-0 relative">
              {activeTab === 'dashboard' && userRole === 'admin' && (
                <div className="p-8">
                    <SalesReport orders={orders} history={history} products={rawProducts} isDarkMode={isDarkMode} />
                </div>
              )}
              
              {activeTab === 'menu' && (
                  <POSView 
                    menu={menu} categories={categories} cart={cart} orders={orders}
                    selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                    availableTokens={availableTokens} selectedToken={selectedToken} onSetToken={setSelectedToken}
                    onAddToCart={addToCart} onRemoveFromCart={removeFromCart} onCheckout={() => setShowCheckout(true)}
                    isDarkMode={isDarkMode} discount={discount} setDiscount={setDiscount} taxRate={taxRate}
                    onConnectDock={connectDock} dockConnected={dockConnected} onCallCustomer={(t) => sendToDock(t)}
                    userRole={userRole}
                    isAddingItem={isAddingItem}
                    setIsAddingItem={setIsAddingItem}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    isCreatingCategory={isCreatingCategory}
                    setIsCreatingCategory={setIsCreatingCategory}
                    handleAdminAddProduct={handleAdminAddProduct}
                    handleAdminDeleteProduct={(id) => { if(confirm("Delete?")) fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(refreshProducts); }}
                    rawProducts={rawProducts}
                  />
              )}

              {activeTab === 'users' && userRole === 'admin' && (
                  <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h2 className="text-2xl font-semibold mb-8">Staff Management</h2>
                      
                      {/* Add User */}
                      <div className={`p-6 rounded-lg border mb-8 ${COMMON_STYLES.card(isDarkMode)}`}>
                          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${theme.text.main}`}>
                              <Plus size={16} /> Add User
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                              <div className="col-span-1">
                                  <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Username</label>
                                  <input 
                                      className={`w-full ${COMMON_STYLES.input(isDarkMode)}`} 
                                      value={newUser.username} 
                                      onChange={e => setNewUser({...newUser, username: e.target.value})} 
                                      placeholder="john_doe"
                                  />
                              </div>
                              <div className="col-span-1">
                                  <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Email</label>
                                  <input 
                                      className={`w-full ${COMMON_STYLES.input(isDarkMode)}`} 
                                      value={newUser.email} 
                                      onChange={e => setNewUser({...newUser, email: e.target.value})} 
                                      placeholder="email@pos.com"
                                  />
                              </div>
                              <div className="col-span-1">
                                  <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Password</label>
                                  <input 
                                      className={`w-full ${COMMON_STYLES.input(isDarkMode)}`} 
                                      type="password" 
                                      value={newUser.password} 
                                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                                      placeholder="••••"
                                  />
                              </div>
                              <div className="col-span-1 flex gap-2">
                                  <div className="flex-1">
                                      <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Role</label>
                                      <select 
                                          className={`w-full ${COMMON_STYLES.select(isDarkMode)}`} 
                                          value={newUser.role} 
                                          onChange={e => setNewUser({...newUser, role: e.target.value})}
                                      >
                                          <option value="cashier">Cashier</option>
                                          <option value="manager">Manager</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                  </div>
                                  <button 
                                      onClick={handleAdminAddUser} 
                                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors outline-none mt-auto ${theme.button.primary}`}
                                  >
                                      Create
                                  </button>
                              </div>
                          </div>
                      </div>
                      
                      {/* User List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {usersList.map(u => (
                              <div 
                                  key={u.id} 
                                  className={`p-5 rounded-lg border flex justify-between items-center group transition-colors ${COMMON_STYLES.card(isDarkMode)} ${theme.border.hover}`}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-md ${theme.bg.subtle}`}>
                                          <User size={20}/>
                                      </div>
                                      <div>
                                          <p className="font-medium text-sm">{u.username || u.email.split('@')[0]}</p>
                                          <p className={`text-xs font-medium ${theme.text.tertiary}`}>{u.role}</p>
                                          <p className={`text-xs ${theme.text.muted}`}>{u.email}</p>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => handleAdminDeleteUser(u.id)} 
                                      className={`p-2 rounded-md opacity-0 group-hover:opacity-100 transition-all outline-none ${theme.bg.hover}`}
                                  >
                                      <Trash2 size={16} className={theme.text.secondary}/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </main>

      <CheckoutModal 
          isOpen={showCheckout} 
          onClose={() => setShowCheckout(false)} 
          onConfirm={finalizeOrder} 
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
      <ActiveOrdersDrawer 
          isOpen={showActiveOrders} 
          onClose={() => setShowActiveOrders(false)} 
          orders={orders} 
          onCompleteOrder={handleMarkReady} 
          onCallCustomer={(t) => sendToDock(t)} 
          isDarkMode={isDarkMode} 
      />
      <AdminSettingsModal 
          open={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
          API_URL={API_URL} 
          restaurantId={getRestaurantId()} 
      />
    </div>
  );
}