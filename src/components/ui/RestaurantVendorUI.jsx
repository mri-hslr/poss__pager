import React, { useEffect, useState, useMemo, useRef } from 'react';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import AdminSettingsModal from './AdminSettingsModal';

export default function RestaurantVendorUI({ user, onLogout }) {
  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("auth_token");

  // --- State ---
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedToken, setSelectedToken] = useState("1");
  const [discount, setDiscount] = useState(0);

  const [showCheckout, setShowCheckout] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Default Settings
  const [settings, setSettings] = useState({ 
    upiId: "aakash@okaxis", 
    payeeName: "Aakash" 
  });

  const [activeUpiData, setActiveUpiData] = useState(null);
  const hasFetched = useRef(false);

  // --- 1. Load Data ---
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function load() {
      try {
        const prodRes = await fetch(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (prodRes.ok) {
            const prodData = await prodRes.json();
            const list = Array.isArray(prodData) ? prodData : prodData.products || [];
            
            // Grouping Logic
            const grouped = {};
            const cats = [];
            list.forEach(p => {
                const cat = p.category || "General";
                if (!grouped[cat]) { grouped[cat] = []; cats.push(cat); }
                grouped[cat].push({ id: Number(p.id), name: p.name, price: Number(p.price) });
            });
            setMenu(grouped);
            setCategories(cats);
            setSelectedCategory(cats[0] || "");
        }

        // Fetch Settings
        const settingsRes = await fetch(`${API_URL}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (settingsRes.ok) {
            const s = await settingsRes.json();
            if (s.upi_id) setSettings({ upiId: s.upi_id, payeeName: s.payee_name });
        }
      } catch (e) { console.error("Init failed:", e); }
    }
    load();
  }, [token]);

  const availableTokens = useMemo(() => {
    const used = orders.map(o => String(o.token));
    return Array.from({ length: 50 }, (_, i) => String(i + 1)).filter(t => !used.includes(t));
  }, [orders]);

  // --- Cart Handlers ---
  const addToCart = item => {
    setCart(p => {
      const f = p.find(i => i.id === item.id);
      return f ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...p, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = item => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(i => i.id !== item.id);
      return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const grandTotal = Math.max(0, total - Number(discount));

  // --- THE FIX: Smart Payload Detection ---
  const finalizeOrder = async (paymentData) => {
    
    // 1. Detect Method regardless of structure
    let method = 'cash';
    if (typeof paymentData === 'string') method = paymentData;
    else if (paymentData?.paymentMethod) method = paymentData.paymentMethod;
    else if (paymentData?.payment?.method) method = paymentData.payment.method;

    console.log("🚀 SENDING PAYMENT METHOD:", method); // Debug: Check this in Console

    const payload = {
      paymentMethod: method.toLowerCase(),
      token: Number(selectedToken),
      items: cart.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      financials: { 
        subtotal: total,
        discount: Number(discount),
        finalPayable: grandTotal 
      }
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      console.log("📦 SERVER RESPONSE:", result);

      // 2. Logic to SHOW QR or CLOSE
      if (method.toLowerCase() === 'upi') {
          if (result.upi && result.upi.qr) {
              setActiveUpiData(result.upi); // ✅ SHOW QR
          } else {
              // Safety: If backend failed to generate QR, tell user
              alert("Backend Error: Order created but QR missing. Check console.");
              handleOrderSuccess(result.orderId);
          }
      } else {
          // Cash/Card -> Close
          handleOrderSuccess(result.orderId);
      }

    } catch (e) { 
      console.error("Order failed:", e); 
      alert("Network Error");
    }
  };

  const handleOrderSuccess = (orderId) => {
    setOrders(p => [...p, { id: orderId || Date.now(), token: selectedToken, items: cart, startedAt: Date.now() }]);
    setCart([]);
    setDiscount(0);
    setShowCheckout(false);
    setActiveUpiData(null);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => { setShowCheckout(false); setActiveUpiData(null); }}
        onConfirm={finalizeOrder}
        onSuccess={() => handleOrderSuccess()}
        cartSubtotal={total}
        taxAmount={0}
        discount={discount}
        grandTotal={grandTotal}
        orderId={orders.length + 1}
        isDarkMode={false}
        upiId={settings.upiId}
        payeeName={settings.payeeName}
        backendUpiData={activeUpiData}
      />

      <AdminSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <POSView
        menu={menu} categories={categories} cart={cart} orders={orders}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        availableTokens={availableTokens} selectedToken={selectedToken} onSetToken={setSelectedToken}
        onAddToCart={addToCart} onRemoveFromCart={removeFromCart} 
        onCheckout={() => setShowCheckout(true)} onLogout={onLogout}
        userRole={user?.role} isDarkMode={false}
        onToggleTheme={() => {}} onOpenOrders={() => {}} onOpenReport={() => {}} onViewOrder={() => {}}
        discount={discount} setDiscount={setDiscount}
        onAddItem={() => {}} onEditItem={() => {}} onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  );
}