import React, { useState } from 'react';
import { Search, Monitor, LogOut, X, ChefHat, RotateCw } from 'lucide-react';

export default function POSView({ 
  menu = {}, 
  categories = [], 
  cart = [], 
  orders = [], 
  selectedCategory, 
  setSelectedCategory, 
  availableTokens, 
  selectedToken, 
  onSetToken, 
  onAddToCart, 
  onRemoveFromCart, 
  onCheckout, 
  onLogout, // 👈 LOGOUT FUNCTION IS HERE
  userRole, 
  isDarkMode, 
  onToggleTheme,
  discount,
  setDiscount,
  taxRate,
  onOpenSettings,
  onMarkReady,
  onCallCustomer
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);

  // Safety fallback if menu is undefined
  const products = menu[selectedCategory] || [];
  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const afterDiscount = Math.max(0, cartSubtotal - Number(discount));
  const taxAmount = afterDiscount * (taxRate / 100);
  const grandTotal = Math.round(afterDiscount + taxAmount);

  const bgMain = isDarkMode ? "bg-slate-900" : "bg-slate-50";
  const bgCard = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const textMain = isDarkMode ? "text-white" : "text-slate-900";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-900";

  return (
    <div className={`flex h-full w-full absolute inset-0 ${bgMain} ${textMain}`}>
      
      {/* LEFT SIDEBAR (Kitchen) */}
      {showLeftSidebar && (
        <>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowLeftSidebar(false)}></div>
          <div className={`absolute inset-y-0 left-0 w-80 shadow-2xl z-50 p-4 flex flex-col transition-transform duration-300 animate-in slide-in-from-left ${isDarkMode ? 'bg-slate-900 border-r border-slate-700' : 'bg-white border-r border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
               <h2 className={`text-xl font-black flex items-center gap-2 ${textMain}`}><ChefHat/> Kitchen</h2>
               <button onClick={() => setShowLeftSidebar(false)} className="p-1 rounded hover:bg-slate-100/10"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {orders.map(order => (
                <div key={order.id} className={`p-4 rounded-xl border relative group ${bgCard}`}>
                    <div className="flex justify-between font-bold mb-2">
                       <span>Token #{order.token}</span>
                       <span className="text-xs font-mono opacity-50">{new Date(order.startedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    {order.items.map((item, idx) => (
                       <div key={idx} className={`text-sm ${textSub}`}>{item.quantity}x {item.name}</div>
                    ))}
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => onCallCustomer(order.token)} className="flex-1 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-bold">Call</button>
                        <button onClick={() => onMarkReady(order.id)} className="flex-1 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold">Done</button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CENTER (Menu) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className={`h-16 border-b flex items-center justify-between px-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowLeftSidebar(true)} className={`p-2 rounded-lg relative ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <ChefHat size={20}/>
                {orders.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
             </button>
             <h1 className="font-black text-xl">POS</h1>
          </div>
          
          <div className="flex-1 max-w-md mx-4 relative">
             <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSub}`} size={16} />
             <input placeholder="Search..." className={`w-full pl-10 pr-4 py-2 rounded-full text-sm outline-none ${inputBg}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
             <button onClick={onToggleTheme} className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-200 text-slate-600'}`}><Monitor size={18}/></button>
             {/* 🔴 LOGOUT BUTTON IS HERE 🔴 */}
             <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                 <LogOut size={16}/> Logout
             </button>
          </div>
        </header>

        {/* CATEGORIES */}
        <div className={`px-4 py-2 flex gap-2 overflow-x-auto border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
           {categories.map(cat => (
             <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white' : `hover:bg-slate-100 dark:hover:bg-slate-800 ${textSub}`}`}>{cat}</button>
           ))}
        </div>

        {/* PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto p-4">
           {filteredProducts.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Search size={48} className="mb-2"/>
                  <h3 className="font-bold">No Products Found</h3>
               </div>
           ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-20">
                  {filteredProducts.map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    return (
                      <div key={item.id} onClick={() => onAddToCart(item)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${bgCard} ${inCart ? 'ring-2 ring-blue-500 border-transparent' : 'hover:border-blue-500/50'}`}>
                         <h3 className="font-bold text-sm truncate mb-1">{item.name}</h3>
                         <div className="flex justify-between items-center">
                            <span className="font-black text-blue-500">₹{item.price}</span>
                            {inCart && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{inCart.quantity}</span>}
                         </div>
                      </div>
                    );
                  })}
               </div>
           )}
        </div>
      </div>

      {/* RIGHT SIDEBAR (Cart) */}
      <div className={`w-80 flex flex-col border-l z-20 ${bgCard}`}>
         <div className="p-4 border-b flex justify-between items-center border-slate-200/10">
            <h2 className="font-black text-lg">Cart</h2>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-60">Token</span>
                <select value={selectedToken} onChange={(e) => onSetToken(e.target.value)} className={`text-sm font-bold border rounded p-1 ${inputBg}`}>
                    {availableTokens.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-3 space-y-2">
             {cart.map(item => (
                 <div key={item.id} className={`p-3 rounded-lg border flex justify-between items-center ${isDarkMode ? 'bg-slate-700/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                     <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-blue-500 font-bold">₹{item.price * item.quantity}</p></div>
                     <div className="flex items-center gap-2">
                         <button onClick={() => onRemoveFromCart(item)} className="px-2 bg-slate-500/10 rounded">-</button>
                         <span className="text-xs font-black">{item.quantity}</span>
                         <button onClick={() => onAddToCart(item)} className="px-2 bg-slate-500/10 rounded">+</button>
                     </div>
                 </div>
             ))}
         </div>

         <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
             <div className="space-y-1 mb-4 text-xs font-medium opacity-70">
                 <div className="flex justify-between"><span>Subtotal</span><span>{cartSubtotal}</span></div>
                 <div className="flex justify-between items-center"><span>Discount</span><input className={`w-12 text-right border rounded p-0.5 ${inputBg}`} type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
                 <div className="flex justify-between"><span>GST ({taxRate}%)</span><span>{Math.round(taxAmount)}</span></div>
             </div>
             <div className="flex justify-between font-black text-xl mb-4"><span>Total</span><span>₹{grandTotal}</span></div>
             <button onClick={onCheckout} disabled={cart.length === 0} className={`w-full py-3 rounded-lg font-black text-lg transition-all ${cart.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                Checkout ₹{grandTotal}
             </button>
         </div>
      </div>
    </div>
  );
}