import React, { useEffect, useState, useMemo, useRef } from 'react';
import POSView from './POSView';
import CheckoutModal from './CheckoutModal';
import AdminSettingsModal from './AdminSettingsModal';

export default function RestaurantVendorUI({ user, onLogout }) {
  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("auth_token");

  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedToken, setSelectedToken] = useState("1");

  const [showCheckout, setShowCheckout] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState({
    upiId: "",
    payeeName: ""
  });

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function load() {
      try {
        const prodRes = await fetch(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const prodData = await prodRes.json();
        const list = Array.isArray(prodData) ? prodData : prodData.products || [];

        const grouped = {};
        const cats = [];

        list.forEach(p => {
          const cat = p.category || "General";
          if (!grouped[cat]) {
            grouped[cat] = [];
            cats.push(cat);
          }
          grouped[cat].push({
            id: Number(p.id),
            name: p.name,
            price: Number(p.price)
          });
        });

        setMenu(grouped);
        setCategories(cats);
        setSelectedCategory(cats[0] || "");

        const settingsRes = await fetch(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const s = await settingsRes.json();
        setSettings({
          upiId: s.upi_id || "",
          payeeName: s.payee_name || ""
        });

      } catch (e) {
        console.error("Init failed:", e);
      }
    }

    load();
  }, []);

  const availableTokens = useMemo(() => {
    const used = orders.map(o => String(o.token));
    return Array.from({ length: 50 }, (_, i) => String(i + 1)).filter(t => !used.includes(t));
  }, [orders]);

  const addToCart = item => {
    setCart(p => {
      const f = p.find(i => i.id === item.id);
      return f
        ? p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...p, { ...item, quantity: 1 }];
    });
  };

  const finalizeOrder = async () => {
    const payload = {
      paymentMethod: "cash",
      token: Number(selectedToken),
      items: cart.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      }))
    };

    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return console.error(await res.text());

    const result = await res.json();

    setOrders(p => [...p, {
      id: result.orderId,
      token: selectedToken,
      items: cart,
      startedAt: Date.now()
    }]);

    setCart([]);
    setShowCheckout(false);
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="h-screen">
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={finalizeOrder}
        cartSubtotal={total}
        taxAmount={0}
        discount={0}
        grandTotal={total}
        orderId={orders.length + 1}
        isDarkMode={false}
        upiId={settings.upiId}
        payeeName={settings.payeeName}
      />

      <AdminSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

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
        onCheckout={() => setShowCheckout(true)}
        onLogout={onLogout}
        userRole={user?.role}
        isDarkMode={false}
        onToggleTheme={() => {}}
        onOpenOrders={() => {}}
        onOpenReport={() => {}}
        onViewOrder={() => {}}
        discount={0}
        setDiscount={() => {}}
        onAddItem={() => {}}
        onEditItem={() => {}}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  );
}