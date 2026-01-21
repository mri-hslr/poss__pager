import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, ChefHat, BarChart3, Sun, Moon, ShoppingCart, 
  ChevronRight, Plus, Minus, Percent, Check, Utensils, X, LogOut, Edit2, Users 
} from 'lucide-react';
import OrderTimer from './OrderTimer';

export default function POSView({
  // Data
  menuItems,
  categories,
  orders,
  cart,
  selectedToken,
  availableTokens,
  discount,
  grandTotal,
  cartSubtotal,
  taxAmount,
  maxDiscount,
  // User Info
  userRole, 
  userName,
  // Actions
  onAddToCart,
  onRemoveFromCart,
  onSetDiscount,
  onSetToken,
  onCheckout,
  onViewOrder,
  onOpenOrders,
  onOpenReport,
  onToggleTheme,
  onLogout,
  onAddItemClick, 
  onEditItemClick,
  onOpenUserManagement,
  theme,
  isDarkMode
}) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  
  // Refs
  const searchRef = useRef(null);
  const categoryRefs = useRef([]);
  const itemRefs = useRef([]); 
  const confirmButtonRef = useRef(null);
  const discountInputRef = useRef(null);

  // --- 1. PREPARE GRID ITEMS ---
  const displayItems = useMemo(() => {
    const items = menuItems.filter(item => 
      item.category === selectedCategory && 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (userRole === 'admin') {
      return [{ id: 'ADD_BUTTON_SPECIAL', isAddButton: true }, ...items];
    }
    return items;
  }, [menuItems, selectedCategory, searchTerm, userRole]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, displayItems.length);
  }, [displayItems]);

  // --- KEYBOARD LOGIC ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      categoryRefs.current[0]?.focus();
    }
  };

  const handleCategoryKeyDown = (e, index) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      itemRefs.current[0]?.focus(); 
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % categories.length;
      setSelectedCategory(categories[next]);
      categoryRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + categories.length) % categories.length;
      setSelectedCategory(categories[prev]);
      categoryRefs.current[prev]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    }
  };

  const handleGridNav = (e, index, item) => {
    const totalItems = displayItems.length;
    // Responsive columns check (Admin view might be wider now)
    const gridCols = window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;

    if (e.key === 'Tab') {
      e.preventDefault();
      // If admin, maybe loop back or go to header. If Staff, go to Checkout button
      if (userRole !== 'admin') confirmButtonRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      itemRefs.current[(index + 1) % totalItems]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      itemRefs.current[(index - 1 + totalItems) % totalItems]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + gridCols;
      if (nextIndex >= totalItems) {
         if (userRole !== 'admin') confirmButtonRef.current?.focus();
      }
      else itemRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index < gridCols) {
        const catIndex = categories.indexOf(selectedCategory);
        categoryRefs.current[catIndex]?.focus();
      } else {
        itemRefs.current[Math.max(index - gridCols, 0)]?.focus();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (item.isAddButton) {
        onAddItemClick();
      } else {
        // ADMIN: Edit | STAFF: Add to Cart
        if (userRole === 'admin') onEditItemClick(item);
        else onAddToCart(item);
      }
    } else if (e.key === 'Backspace' && !item.isAddButton) {
      if (userRole !== 'admin') {
        e.preventDefault();
        onRemoveFromCart(item);
      }
    }
  };

  const handleConfirmButtonKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (displayItems.length > 0) itemRefs.current[displayItems.length - 1]?.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* --- LEFT SIDE (MAIN CONTENT) --- */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            {/* Header */}
            <div className={`${theme.bgCard} border-b ${theme.border} px-4 md:px-6 py-3 md:py-4 flex justify-between items-center gap-4 shadow-sm z-10 shrink-0`}>
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-lg md:text-xl font-black tracking-tight leading-none">POS System</h1>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-bold ${theme.accent} text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider text-[10px]`}>
                        {userRole === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                      <span className={`font-medium ${theme.textMain} opacity-80`}>{userName}</span>
                      <span className={`${theme.textSec} hidden md:inline opacity-50`}>|</span>
                      <span className={`${theme.textSec} hidden md:inline cursor-pointer hover:text-blue-500`} onClick={onOpenOrders}>Active: {orders.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full justify-end">
                    <div className="relative w-full max-w-[180px] md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input ref={searchRef} onKeyDown={handleSearchKeyDown} className={`w-full pl-9 pr-4 py-2 ${theme.inputBg} border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none ${theme.textMain}`} placeholder="Search (Ctrl+F)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    {/* Buttons */}
                    <button onClick={onOpenOrders} className={`md:hidden p-2 rounded-full ${theme.bgHover} ${theme.textSec} border ${theme.border}`}><ChefHat size={18} /></button>
                    
                    {userRole === 'admin' && (
                      <>
                        <button onClick={onOpenUserManagement} className={`p-2 rounded-full ${theme.bgHover} text-purple-500 border ${theme.border} hover:bg-purple-50 transition-colors`} title="Manage Users"><Users size={18} /></button>
                        <button onClick={onAddItemClick} className={`hidden md:flex p-2 rounded-full bg-blue-100 text-blue-600 border border-blue-200 hover:scale-105 transition-transform`} title="Add Dish"><Plus size={18} strokeWidth={3} /></button>
                      </>
                    )}
                    
                    <button onClick={onOpenReport} className={`p-2 rounded-full ${theme.bgHover} ${theme.textSec} border ${theme.border}`} title="Report"><BarChart3 size={18} /></button>
                    <button onClick={onToggleTheme} className={`p-2 rounded-full ${theme.bgHover} ${theme.textSec} border ${theme.border}`} title="Theme (Ctrl+D)">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                    <button onClick={onLogout} className={`p-2 rounded-full hover:bg-red-100 text-red-500 border ${theme.border}`} title="Logout"><LogOut size={18} /></button>
                </div>
            </div>

            {/* Active Tokens Strip */}
            {orders.length > 0 && (
                <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-stone-50'} border-b ${theme.border} px-4 md:px-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0`}>
                    <div className="flex gap-3 items-center">
                        {orders.map((o) => (
                        <button key={o.id} onClick={() => onViewOrder(o)} className={`cursor-pointer inline-flex items-center gap-2 ${theme.bgCard} border ${theme.border} rounded-full px-1 py-1 pr-3 shadow-sm transition-all`}>
                            <span className={`text-xs font-bold text-white ${theme.accent} px-2 py-0.5 rounded-full`}>T-{o.token}</span>
                            <span className={`text-xs font-mono border-l pl-2 ${theme.border}`}><OrderTimer startedAt={o.startedAt} /></span>
                        </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories */}
            <div className={`${theme.bgCard} border-b ${theme.border} px-4 md:px-6 py-2 overflow-x-auto whitespace-nowrap shrink-0`}>
                <div className="flex gap-2">
                    {categories.map((cat, i) => (
                    <button key={cat} ref={(el) => (categoryRefs.current[i] = el)} onClick={() => setSelectedCategory(cat)} onKeyDown={(e) => handleCategoryKeyDown(e, i)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-500 ${selectedCategory === cat ? `${theme.accent} text-white shadow-md` : `${isDarkMode ? 'bg-slate-800' : 'bg-stone-100'} ${theme.textSec}`}`}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${isDarkMode ? 'bg-slate-950' : 'bg-stone-50/50'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-20">
                    
                    {displayItems.map((item, index) => {
                      
                      // 1. ADD BUTTON (Admin Only Special Item)
                      if (item.isAddButton) {
                        return (
                          <div 
                            key="add-btn"
                            ref={(el) => (itemRefs.current[index] = el)}
                            tabIndex={0}
                            onKeyDown={(e) => handleGridNav(e, index, item)}
                            onClick={onAddItemClick} 
                            className={`border-2 border-dashed ${theme.border} rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50/10 hover:border-blue-400 transition-all text-stone-400 hover:text-blue-500 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <Plus size={32} />
                            <span className="font-bold text-sm">Add New Dish</span>
                          </div>
                        );
                      }

                      // 2. DISH CARD
                      const count = cart.find(c => c.id === item.id)?.quantity || 0;
                      return (
                        <div 
                          key={item.id} 
                          ref={(el) => (itemRefs.current[index] = el)}
                          tabIndex={0}
                          onKeyDown={(e) => handleGridNav(e, index, item)}
                          // ADMIN: Click to Edit | STAFF: Click to Add to Cart
                          onClick={() => userRole === 'admin' ? onEditItemClick(item) : onAddToCart(item)} 
                          className={`${theme.bgCard} border ${theme.border} rounded-xl p-3 md:p-4 shadow-sm active:scale-95 transition-all flex flex-col gap-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 group relative overflow-hidden`}
                        >
                            <div className="flex gap-3 pointer-events-none">
                                <div className={`w-14 h-14 md:w-16 md:h-16 ${theme.inputBg} rounded-lg flex items-center justify-center overflow-hidden shrink-0`}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                    ) : null}
                                    <div className="w-full h-full flex items-center justify-center" style={{display: item.image ? 'none' : 'flex'}}><Utensils className="text-stone-300" size={24} /></div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold leading-tight text-sm md:text-base">{item.name}</h3>
                                    <div className={`${theme.textSec} text-xs md:text-sm mt-1`}>₹{item.price}</div>
                                </div>
                            </div>

                            {/* BOTTOM ACTION AREA */}
                            <div className={`flex items-center justify-between mt-auto pt-2 border-t ${theme.border} pointer-events-none`}>
                              {userRole === 'admin' ? (
                                // ADMIN VIEW
                                <div className="w-full flex items-center justify-center gap-1 text-blue-500 text-xs font-bold opacity-80 group-hover:opacity-100">
                                  <Edit2 size={12}/> Modify Dish
                                </div>
                              ) : (
                                // STAFF VIEW (Counter)
                                count > 0 ? (
                                    <div className={`flex items-center gap-3 ${theme.inputBg} rounded-lg px-2 py-1 w-full justify-between`}>
                                    <span className="font-semibold text-sm w-4 text-center">{count}</span>
                                    </div>
                                ) : <div className="w-full text-center text-stone-400 text-xs">Add</div>
                              )}
                            </div>
                        </div>
                      );
                    })}
                </div>
            </div>

            {/* Mobile Cart Toggle (HIDDEN FOR ADMIN) */}
            {userRole !== 'admin' && cart.length > 0 && (
                <div className="md:hidden absolute bottom-4 left-4 right-4 z-40">
                    <button onClick={() => setMobileCartOpen(true)} className={`w-full ${theme.accent} text-white p-4 rounded-2xl shadow-xl flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{cart.reduce((a, b) => a + b.quantity, 0)}</div>
                        <div className="text-left"><div className="text-xs opacity-80">Total</div><div className="font-bold">₹{cartSubtotal}</div></div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-sm">View Cart <ChevronRight size={16} /></div>
                    </button>
                </div>
            )}
        </div>

        {/* --- RIGHT SIDE (CART) - HIDDEN FOR ADMIN --- */}
        {userRole !== 'admin' && (
          <>
            {mobileCartOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setMobileCartOpen(false)} />}
            
            <div className={`fixed inset-y-0 right-0 w-[85%] md:w-[380px] ${theme.bgCard} border-l ${theme.border} h-full flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ${mobileCartOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} md:static`}>
                <div className={`p-5 border-b ${theme.border} ${isDarkMode ? 'bg-slate-900' : 'bg-stone-50'} flex justify-between items-center`}>
                    <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Current Order</h2>
                    <button onClick={() => setMobileCartOpen(false)} className="md:hidden p-2 bg-stone-100 rounded-full"><X size={20} className="text-black"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p>Start adding items</p>
                        </div>
                    ) : (
                        cart.map((i) => (
                            <div key={i.id} className={`flex justify-between items-center py-3 border-b ${theme.border} last:border-0 group`}>
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{i.name}</div>
                                    <div className={`text-xs ${theme.textSec}`}>₹{i.price * i.quantity}</div>
                                </div>
                                <div className={`flex items-center gap-2 ${theme.inputBg} rounded-lg border ${theme.border} px-1 py-0.5`}>
                                    <button onClick={() => onRemoveFromCart(i)} className={`p-1 ${theme.bgHover} rounded shadow-sm`}><Minus size={12} /></button>
                                    <span className="text-xs font-semibold w-4 text-center">{i.quantity}</span>
                                    <button onClick={() => onAddToCart(i)} className={`p-1 ${theme.bgHover} rounded shadow-sm`}><Plus size={12} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className={`p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-stone-50'} border-t ${theme.border} space-y-3`}>
                    <div className="space-y-1 text-sm">
                        <div className={`flex justify-between ${theme.textSec}`}><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
                        <div className={`flex justify-between ${theme.textSec}`}><span>Tax (5%)</span><span>+₹{taxAmount}</span></div>
                        <div className={`flex justify-between ${theme.textSec}`}><span>Discount</span><span className={discount > 0 ? 'text-green-500' : ''}>-₹{discount}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                        {showDiscountInput ? (
                        <div className="flex items-center gap-2 w-full animate-in fade-in">
                            <span className="text-xs font-bold text-stone-400">₹</span>
                            <input ref={discountInputRef} type="number" min="0" max={maxDiscount} value={discount || ''} onChange={e => { const val = Number(e.target.value); if (val >= 0 && val <= maxDiscount) onSetDiscount(val); else if (val > maxDiscount) onSetDiscount(maxDiscount); }} className={`w-full p-2 text-sm rounded-lg ${theme.inputBg} ${theme.textMain} outline-none border ${theme.border}`} placeholder="Disc Amount" />
                            <button onClick={() => setShowDiscountInput(false)} className="p-2 bg-stone-200 text-stone-600 rounded-lg"><Check size={14}/></button>
                        </div>
                        ) : (
                        <button onClick={() => setShowDiscountInput(true)} className={`text-xs flex items-center gap-1 ${theme.textSec} hover:text-blue-500`}><Percent size={12}/> Add Discount</button>
                        )}
                    </div>
                    <div className={`flex justify-between items-center text-xl font-bold ${theme.textMain} pt-2 border-t ${theme.border}`}><span>Total</span><span>₹{grandTotal}</span></div>
                    <div className="space-y-2 pt-2">
                        <select value={selectedToken} onChange={(e) => onSetToken(e.target.value)} className={`w-full p-2.5 rounded-lg border ${theme.border} ${theme.bgCard} ${theme.textMain} text-sm focus:ring-2 focus:ring-blue-500 outline-none`}>
                        {availableTokens.length === 0 ? <option disabled>No Tokens</option> : <><option value="" disabled>Select Token</option>{availableTokens.map((t) => <option key={t} value={t}>Token {t}</option>)}</>}
                        </select>
                        <button ref={confirmButtonRef} onKeyDown={handleConfirmButtonKeyDown} onClick={onCheckout} disabled={!cart.length || !selectedToken} className={`w-full py-3 ${theme.accent} ${theme.accentText} rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg`}>Checkout</button>
                    </div>
                </div>
            </div>
          </>
        )}
    </div>
  );
}