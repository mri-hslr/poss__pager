import React from 'react';
import { Settings, Plus, Minus, Search, LogOut } from 'lucide-react';

const POSView = ({ 
    menu, categories, cart, orders, 
    selectedCategory, setSelectedCategory,
    availableTokens, selectedToken, onSetToken,
    onAddToCart, onRemoveFromCart, 
    onCheckout, onLogout,
    userRole, isDarkMode, onToggleTheme,
    onOpenOrders, onOpenReport,
    onViewOrder, discount, setDiscount,
    onAddItem, onEditItem, onOpenSettings
}) => {

    const cartSubtotal = cart.reduce((s, i) => s + (Number(i.price) * i.quantity), 0);
    const taxAmount = 0; // Keeping simple as per your screenshot
    const grandTotal = Math.max(0, cartSubtotal - Number(discount));

    const themeClass = isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-white text-gray-900';
    const borderClass = isDarkMode ? 'border-slate-800' : 'border-gray-200';
    const cardClass = isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200';

    return (
        <div className={`flex h-screen ${themeClass}`}>
            {/* Left: Menu Area */}
            <div className={`flex-1 flex flex-col overflow-hidden border-r ${borderClass}`}>
                <header className={`p-4 border-b ${borderClass} flex justify-between items-center`}>
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold">POS Terminal</h1>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {userRole === 'admin' && (
                             <button onClick={onOpenSettings} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                                <Settings size={20} />
                             </button>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input type="text" placeholder="Search (Ctrl+F)" className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(menu[selectedCategory] || []).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => onAddToCart(item)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500 transition-all h-40 flex flex-col justify-between group"
                            >
                                <h3 className="font-bold text-gray-800">{item.name}</h3>
                                <p className="text-gray-500 text-sm">₹{item.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart Area */}
            <div className="w-[400px] flex flex-col bg-white">
                <div className={`p-4 border-b ${borderClass} flex justify-between items-center bg-gray-50/50`}>
                    <h2 className="font-bold text-lg">Cart</h2>
                    <div className="flex items-center gap-3">
                         <select 
                            value={selectedToken} 
                            onChange={(e) => onSetToken(e.target.value)}
                            className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none font-bold shadow-sm"
                        >
                            {availableTokens.map(t => <option key={t} value={t}>Token {t}</option>)}
                        </select>
                         <button onClick={onLogout} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                            <LogOut size={18} />
                         </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p>Cart is empty</p>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                <p className="text-blue-600 font-bold text-xs">₹{item.price * item.quantity}</p>
                            </div>
                            {/* ✅ RESTORED: Plus/Minus Buttons */}
                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                                <button onClick={() => onRemoveFromCart(item)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                    <Minus size={14} />
                                </button>
                                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                <button onClick={() => onAddToCart(item)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ✅ RESTORED: Discount Input & Totals */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3 mb-4 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{cartSubtotal}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500">
                            <span>Discount</span>
                            <div className="flex items-center gap-1 border-b border-gray-300">
                                <span>- ₹</span>
                                <input 
                                    type="number" 
                                    value={discount} 
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="w-12 bg-transparent text-right outline-none font-medium text-red-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>₹{grandTotal}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Checkout ₹{grandTotal}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSView;