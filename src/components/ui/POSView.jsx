import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Moon, Sun, BarChart3, Plus, Minus, LogOut, Utensils, Edit3, Percent, Check } from 'lucide-react';
import OrderTimer from './OrderTimer';

export default function POSView({
  menu, categories, cart, orders, availableTokens, selectedToken, onSetToken,
  onAddToCart, onRemoveFromCart, onCheckout, onLogout,
  isDarkMode, onToggleTheme, onOpenOrders, onOpenReport, onViewOrder,
  discount, setDiscount, onAddItem, onEditItem, userRole, 
  selectedCategory, setSelectedCategory
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  
  const isAdmin = userRole === 'admin';

  // Refs
  const searchRef = useRef(null);
  const categoryRefs = useRef([]);
  const itemRefs = useRef([]);
  const tokenRefs = useRef([]);
  const confirmButtonRef = useRef(null);
  const discountInputRef = useRef(null);

  // --- SHORTCUTS RESTORED ---
  useEffect(() => {
    const h = (e) => {
        // Search (Ctrl + F)
        if (e.ctrlKey && e.key.toLowerCase() === 'f') { 
            e.preventDefault(); 
            searchRef.current?.focus(); 
        }
        // Active Orders (Ctrl + O)
        if (e.ctrlKey && e.key.toLowerCase() === 'o') { 
            e.preventDefault(); 
            onOpenOrders(); // Calls the prop directly
        }
        // Dark Mode (Ctrl + D)
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
      return menu[selectedCategory].filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [menu, selectedCategory, searchTerm]);

  // Update refs
  useEffect(() => { itemRefs.current = itemRefs.current.slice(0, filteredItems.length); }, [filteredItems]);
  useEffect(() => { tokenRefs.current = tokenRefs.current.slice(0, orders.length); }, [orders]);
  useEffect(() => { if (showDiscountInput) setTimeout(() => discountInputRef.current?.focus(), 50); }, [showDiscountInput]);

  // --- NAVIGATION LOGIC ---
  const handleSearchKeyDown = (e) => { 
      if (e.key === 'ArrowDown') { 
          e.preventDefault(); 
          if (orders.length > 0) tokenRefs.current[0]?.focus(); 
          else categoryRefs.current[0]?.focus(); 
      } 
  };

  const handleTokenKeyDown = (e, index, order) => { 
      if (e.key === 'ArrowRight') tokenRefs.current[(index + 1) % orders.length]?.focus(); 
      else if (e.key === 'ArrowLeft') tokenRefs.current[(index - 1 + orders.length) % orders.length]?.focus(); 
      else if (e.key === 'ArrowDown') categoryRefs.current[0]?.focus(); 
      else if (e.key === 'ArrowUp') searchRef.current?.focus(); 
      else if (e.key === 'Enter') onViewOrder(order); 
  };

  const handleCategoryKeyDown = (e, index) => { 
      if (e.key === 'ArrowRight') { 
          const next = (index + 1) % categories.length; 
          setSelectedCategory(categories[next]); 
          categoryRefs.current[next]?.focus(); 
      } else if (e.key === 'ArrowLeft') {
          const prev = (index - 1 + categories.length) % categories.length;
          setSelectedCategory(categories[prev]);
          categoryRefs.current[prev]?.focus();
      } else if (e.key === 'ArrowDown') {
          itemRefs.current[0]?.focus(); 
      }
  };

  const handleMenuItemKeyDown = (e, index, item) => { 
      // Grid Navigation
      const gridCols = isAdmin ? 5 : (window.innerWidth >= 1280 ? 4 : 3); // Approximate columns based on mode
      
      if (e.key === 'ArrowRight') itemRefs.current[(index + 1) % filteredItems.length]?.focus();
      else if (e.key === 'ArrowLeft') itemRefs.current[(index - 1 + filteredItems.length) % filteredItems.length]?.focus();
      else if (e.key === 'ArrowDown') itemRefs.current[index + gridCols]?.focus();
      else if (e.key === 'ArrowUp') {
          if (index < gridCols) categoryRefs.current[0]?.focus();
          else itemRefs.current[index - gridCols]?.focus();
      }
      // Action
      else if (e.key === 'Enter' && !isAdmin) onAddToCart(item); 
  };

  const handleConfirmButtonKeyDown = (e) => { 
      if (e.key === 'Tab') { 
          if (orders.length > 0) tokenRefs.current[0]?.focus(); 
          else { setSelectedCategory(categories[0]); categoryRefs.current[0]?.focus(); } 
      } 
  };

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
    <div className={`flex flex-1 h-full overflow-hidden transition-colors duration-200 ${theme.bgMain} ${theme.textMain}`}>
      
      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex flex-col h-full overflow-hidden relative ${isAdmin ? 'w-full' : 'flex-1'}`}>
        
        {/* HEADER */}
        <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${theme.bgCard}`}>
          <div><h1 className="text-xl font-bold">{isAdmin ? 'Menu Manager' : 'POS Terminal'}</h1><p className={`text-xs ${theme.textSec} cursor-pointer`} onClick={onOpenOrders}>Manage Active (Ctrl+O)</p></div>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.inputBg} w-64`}><Search size={16}/><input ref={searchRef} onKeyDown={handleSearchKeyDown} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search (Ctrl+F)" className="bg-transparent outline-none w-full text-sm"/></div>
             <button onClick={onOpenReport} className={`p-2 rounded-lg border ${theme.border} hover:text-green-600`}><BarChart3 size={18}/></button>
             <button onClick={onToggleTheme} className={`p-2 rounded-lg border ${theme.border}`}>{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
             
             {isAdmin && (
                <button onClick={onAddItem} className={`p-2 rounded-lg border ${theme.border} text-blue-600 hover:bg-blue-50`}>
                    <Plus size={18}/>
                </button>
             )}

             <div className="hidden md:flex flex-col items-end mr-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isAdmin ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                    {userRole || 'Guest'}
                </span>
             </div>

             <button onClick={onLogout} className="text-xs text-red-500 hover:underline font-bold"><LogOut size={16}/></button>
          </div>
        </div>
        
        {/* ACTIVE ORDERS STRIP */}
        {orders.length > 0 && <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-stone-50'} border-b ${theme.border} px-4 py-2 overflow-x-auto`}><div className="flex gap-3">{orders.map((o, i) => <button key={o.id} ref={el => tokenRefs.current[i] = el} onKeyDown={e => handleTokenKeyDown(e, i, o)} onClick={() => onViewOrder(o)} className={`flex items-center gap-2 ${theme.bgCard} border ${theme.border} rounded-full px-1 py-1 pr-3 shadow-sm`}><span className={`text-xs font-bold ${theme.accent} text-white px-2 py-0.5 rounded-full`}>T-{o.token}</span><OrderTimer startedAt={o.startedAt}/></button>)}</div></div>}
        
        {/* CATEGORIES */}
        <div className={`px-6 py-4 flex gap-2 overflow-x-auto ${theme.bgMain}`}>{categories.map((cat, i) => <button key={cat} ref={el => categoryRefs.current[i] = el} onClick={() => setSelectedCategory(cat)} onKeyDown={e => handleCategoryKeyDown(e, i)} className={`px-4 py-1.5 rounded-full text-sm font-bold border ${selectedCategory === cat ? `${theme.accent} text-white` : theme.border}`}>{cat}</button>)}</div>
        
        {/* GRID */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${isDarkMode ? 'bg-slate-950' : 'bg-stone-50/50'}`}>
          <div className={`grid gap-4 ${isAdmin ? 'grid-cols-3 md:grid-cols-5 xl:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
            {filteredItems.map((item, i) => (
              <div 
                key={item.id} 
                ref={el => itemRefs.current[i] = el} 
                tabIndex={0} 
                onKeyDown={e => handleMenuItemKeyDown(e, i, item)} 
                onClick={() => !isAdmin && onAddToCart(item)} 
                className={`${theme.bgCard} border ${theme.border} rounded-xl p-4 relative group hover:shadow-md focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!isAdmin ? 'cursor-pointer active:scale-95' : ''}`}
              >
                
                {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-10">
                        <button onClick={(e) => {e.stopPropagation(); onEditItem(item);}} className="p-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-600 shadow-sm">
                            <Edit3 size={14}/>
                        </button>
                    </div>
                )}

                <div className="flex gap-3 pointer-events-none">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${theme.inputBg}`}>{item.imageQuery ? <div className="text-2xl">🍽️</div> : <Utensils/>}</div>
                  <div><h3 className="font-bold text-sm">{item.name}</h3><div className={`text-xs ${theme.textSec}`}>₹{item.price}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CART SIDEBAR (HIDDEN FOR ADMIN) --- */}
      {!isAdmin && (
          <div className={`w-[350px] border-l ${theme.border} ${theme.bgCard} flex flex-col shadow-xl`}>
             <div className={`p-4 border-b ${theme.border} font-bold flex items-center gap-2`}><ShoppingCart size={20}/> Current Order</div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">{cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-40"><ShoppingCart size={48}/><p>Empty</p></div> : cart.map(item => <div key={item.id} className="flex justify-between items-center"><div><div className="font-bold text-sm">{item.name}</div><div className="text-xs opacity-60">₹{item.price} x {item.quantity}</div></div><div className="flex items-center gap-2 border rounded p-1"><button onClick={() => onRemoveFromCart(item)}><Minus size={12}/></button><span className="text-sm w-4 text-center">{item.quantity}</span><button onClick={() => onAddToCart(item)}><Plus size={12}/></button></div></div>)}</div>
             <div className={`p-4 border-t ${theme.border} space-y-3`}>
               <div className="flex justify-between text-sm opacity-70"><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
               <div className="flex justify-between text-sm opacity-70"><span>Tax (5%)</span><span>₹{taxAmount}</span></div>
               <div className="flex justify-between text-sm opacity-70 items-center"><span>Discount</span><div className="flex gap-2">{showDiscountInput ? <div className="flex items-center gap-1"><input ref={discountInputRef} type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className={`w-16 p-1 border rounded text-right ${theme.inputBg}`} /><button onClick={() => setShowDiscountInput(false)}><Check size={14}/></button></div> : <button onClick={() => setShowDiscountInput(true)} className="text-xs text-blue-500 flex items-center gap-1"><Percent size={12}/> Add</button>}</div></div>
               <div className="flex justify-between text-xl font-bold border-t pt-2 border-dashed"><span>Total</span><span>₹{grandTotal}</span></div>
               <select value={selectedToken} onChange={e => onSetToken(e.target.value)} className={`w-full p-2.5 border rounded-lg outline-none ${theme.bgCard} ${theme.border} text-sm font-bold`}>{availableTokens.map(t => <option key={t} value={t}>Token {t}</option>)}</select>
               <button ref={confirmButtonRef} onKeyDown={handleConfirmButtonKeyDown} onClick={onCheckout} disabled={!cart.length || !selectedToken} className={`w-full py-3 ${theme.accent} ${theme.accentText} rounded-xl font-bold shadow-lg disabled:opacity-50`}>Checkout</button>
             </div>
          </div>
      )}
    </div>
  );
}