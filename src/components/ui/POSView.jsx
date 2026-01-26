import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Moon,
  Sun,
  BarChart3,
  Plus,
  Minus,
  LogOut,
  Utensils,
  Edit3,
  Percent,
  Check,
  Settings
} from 'lucide-react';

import OrderTimer from './OrderTimer';

export default function POSView({
  menu,
  categories,
  cart,
  orders,
  availableTokens,
  selectedToken,
  onSetToken,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  onLogout,
  isDarkMode,
  onToggleTheme,
  onOpenOrders,
  onOpenReport,
  onViewOrder,
  discount,
  setDiscount,
  onAddItem,
  onEditItem,
  userRole,
  selectedCategory,
  setSelectedCategory,
  onOpenSettings // 👈 REQUIRED PROP
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const isAdmin = userRole === 'admin';

  const searchRef = useRef(null);
  const categoryRefs = useRef([]);
  const itemRefs = useRef([]);
  const tokenRefs = useRef([]);
  const discountInputRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        onOpenOrders();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onToggleTheme();
      }
    };

    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onOpenOrders, onToggleTheme]);

  const filteredItems = useMemo(() => {
    if (!menu[selectedCategory]) return [];
    return menu[selectedCategory].filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menu, selectedCategory, searchTerm]);

  useEffect(() => {
    if (showDiscountInput) {
      setTimeout(() => discountInputRef.current?.focus(), 50);
    }
  }, [showDiscountInput]);

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.round(cartSubtotal * 0.05);
  const grandTotal = Math.max(0, cartSubtotal + taxAmount - discount);

  const theme = {
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-stone-50',
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white',
    textMain: isDarkMode ? 'text-slate-100' : 'text-stone-800',
    textSec: isDarkMode ? 'text-slate-400' : 'text-stone-500',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-stone-100',
    accent: isDarkMode ? 'bg-blue-600' : 'bg-stone-900',
    accentText: 'text-white'
  };

  return (
    <div className={`flex flex-1 h-full overflow-hidden ${theme.bgMain} ${theme.textMain}`}>
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${theme.bgCard}`}>
          <div>
            <h1 className="text-xl font-bold">{isAdmin ? 'Menu Manager' : 'POS Terminal'}</h1>
            <p className={`text-xs ${theme.textSec} cursor-pointer`} onClick={onOpenOrders}>
              Manage Active (Ctrl+O)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.inputBg} w-64`}>
              <Search size={16} />
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search (Ctrl+F)"
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>

            {/* Report */}
            <button onClick={onOpenReport} className="p-2 border rounded">
              <BarChart3 size={18} />
            </button>

            {/* Theme */}
            <button onClick={onToggleTheme} className="p-2 border rounded">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* ADMIN BUTTONS */}
            {isAdmin && (
              <>
                <button onClick={onAddItem} className="p-2 border rounded text-blue-600">
                  <Plus size={18} />
                </button>

                {/* ⚙️ SETTINGS BUTTON */}
                <button
                  onClick={onOpenSettings}
                  className="p-2 border rounded text-purple-600"
                  title="Payment Settings"
                >
                  <Settings size={18} />
                </button>
              </>
            )}

            <button onClick={onLogout} className="text-red-500">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="px-6 py-4 flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                selectedCategory === cat ? `${theme.accent} text-white` : theme.border
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => !isAdmin && onAddToCart(item)}
              className={`${theme.bgCard} border ${theme.border} rounded-xl p-4 hover:shadow cursor-pointer`}
            >
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-sm opacity-60">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CART (only for cashier) */}
      {!isAdmin && (
        <div className="w-[320px] border-l p-4">
          <h2 className="font-bold mb-3">Cart</h2>

          {cart.map(item => (
            <div key={item.id} className="flex justify-between mb-2">
              <span>{item.name}</span>
              <span>{item.quantity}</span>
            </div>
          ))}

          <button
            onClick={onCheckout}
            className="mt-4 w-full bg-black text-white py-2 rounded"
          >
            Checkout ₹{grandTotal}
          </button>
        </div>
      )}
    </div>
  );
}