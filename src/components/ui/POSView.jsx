import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Wifi, ChevronDown, Box, Bell, Settings, Moon, Sun, X as XIcon } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function POSView({
  menu, categories, cart, orders, selectedCategory, setSelectedCategory,
  availableTokens, selectedToken, onSetToken, onAddToCart, onRemoveFromCart,
  onCheckout, userRole, isDarkMode, discount, setDiscount, taxRate,
  onOpenSettings, onOpenActiveOrders, onConnectDock, dockConnected,
  isAddingItem, setIsAddingItem, newItem, setNewItem, isCreatingCategory, setIsCreatingCategory,
  handleAdminAddProduct, handleAdminDeleteProduct, rawProducts
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const theme = getTheme(isDarkMode);

  const filteredProducts = useMemo(() => {
    let products = [];
    if (selectedCategory === "All" || !selectedCategory) {
      Object.values(menu).forEach(catProducts => products.push(...catProducts));
    } else {
      products = menu[selectedCategory] || [];
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(lowerSearch));
    }
    return products;
  }, [menu, selectedCategory, searchTerm]);

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = (Math.max(0, cartSubtotal - discount)) * (taxRate / 100);
  const grandTotal = Math.round((Math.max(0, cartSubtotal - discount)) + taxAmount);

  return (
    <div className={`flex h-full ${theme.bg.main} ${theme.text.main}`} style={{ fontFamily: FONTS.sans }}>
      {/* --- LEFT SIDE: MENU --- */}
      <div className={`flex-1 flex flex-col border-r ${theme.border.default} ${theme.bg.main}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between gap-4 ${theme.border.default} ${theme.bg.main}`}>
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} size={20} />
            <input
              type="text"
              placeholder="Search menu..."
              className={`w-full ${COMMON_STYLES.input(isDarkMode)} pl-12 pr-4 py-3`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative hidden md:block">
            <select
              className={`w-full ${COMMON_STYLES.select(isDarkMode)} pl-4 pr-10 py-3`}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.text.secondary}`} size={16} />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onConnectDock} 
              className={`p-3 rounded-xl border transition-all ${dockConnected ? `border-${theme.text.main} ${theme.bg.subtle}` : `${theme.border.default} ${theme.button.ghost}`}`}
            >
              <Wifi size={20} className={dockConnected ? 'animate-pulse' : ''}/>
            </button>
            <button 
              onClick={onOpenActiveOrders} 
              className={`p-3 rounded-xl border relative transition-all ${theme.border.default} ${theme.button.ghost}`}
            >
              <Bell size={20} />
              {orders.length > 0 && (
                <span className={`absolute -top-1 -right-1 h-5 w-5 ${theme.bg.main} ${theme.text.main} text-xs font-black rounded-full flex items-center justify-center border-2 ${theme.border.default}`}>
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Categories */}
        <div className={`md:hidden p-4 pb-0 flex gap-3 overflow-x-auto scrollbar-hide ${theme.bg.main}`}>
          <button 
            onClick={() => setSelectedCategory("All")} 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${selectedCategory === 'All' ? theme.button.primary : `${theme.border.default} ${theme.button.secondary}`}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${selectedCategory === cat ? theme.button.primary : `${theme.border.default} ${theme.button.secondary}`}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Admin Content (Add Product) */}
        {userRole === 'admin' && isAddingItem && (
          <div className={`p-6 ${theme.bg.main}`}>
            <div className={`p-6 ${COMMON_STYLES.card(isDarkMode)} mb-6 animate-in fade-in zoom-in-95`}>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <input 
                  placeholder="Name" 
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`} 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})} 
                />
                <input 
                  placeholder="Price (₹)" 
                  type="number" 
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`} 
                  value={newItem.price} 
                  onChange={e => setNewItem({...newItem, price: e.target.value})} 
                />
                <input 
                  placeholder="Stock Qty" 
                  type="number" 
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`} 
                  value={newItem.stock} 
                  onChange={e => setNewItem({...newItem, stock: e.target.value})} 
                />
                <div className="relative">
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <input 
                        placeholder="New Cat" 
                        className={`w-full flex-1 ${COMMON_STYLES.input(isDarkMode)}`} 
                        value={newItem.category} 
                        onChange={e => setNewItem({...newItem, category: e.target.value})} 
                        autoFocus 
                      />
                      <button 
                        onClick={() => { setIsCreatingCategory(false); setNewItem({...newItem, category: ''}) }} 
                        className={`px-3 py-2 rounded-xl ${theme.button.ghost}`}
                      >
                        <XIcon size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        className={`w-full ${COMMON_STYLES.select(isDarkMode)}`} 
                        value={newItem.category} 
                        onChange={(e) => { 
                          if (e.target.value === '__NEW__') { 
                            setIsCreatingCategory(true); 
                            setNewItem({...newItem, category: ''}); 
                          } else { 
                            setNewItem({...newItem, category: e.target.value}); 
                          } 
                        }}
                      >
                        <option value="" disabled>Category</option>
                        {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        <option value="__NEW__">+ Add New</option>
                      </select>
                      <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${theme.text.secondary}`} size={16} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setIsAddingItem(false); setIsCreatingCategory(false); }} 
                  className={`px-6 py-2 rounded-lg font-medium ${theme.button.secondary}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdminAddProduct} 
                  className={`px-8 py-2 rounded-lg font-medium ${theme.button.primary}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Product List */}
        {userRole === 'admin' && !isAddingItem && (
          <div className={`flex-1 overflow-y-auto p-6 ${theme.bg.main}`}>
            <div className={`rounded-2xl overflow-hidden ${COMMON_STYLES.card(isDarkMode)}`}>
              <table className="w-full text-left">
                <thead className={`${COMMON_STYLES.tableHeader(isDarkMode)}`}>
                  <tr>
                    <th className="p-4 pl-6">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Price</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rawProducts.map(p => (
                    <tr key={p.id} className={`${COMMON_STYLES.tableRow(isDarkMode)}`}>
                      <td className="p-4 pl-6 font-medium">{p.name}</td>
                      <td className="p-4">
                        <span className={`${COMMON_STYLES.badge(isDarkMode)}`}>{p.category}</span>
                      </td>
                      <td className={`p-4 font-medium flex items-center gap-2 ${theme.text.main}`}>
                        <Box size={16} className={theme.text.secondary}/> {p.stock}
                      </td>
                      <td className={`p-4 font-mono ${theme.text.main}`}>₹{p.price}</td>
                      <td className="p-4 text-right pr-6">
                        <button 
                          onClick={() => handleAdminDeleteProduct(p.id)} 
                          className={`p-2 rounded-lg transition-colors outline-none ${theme.button.ghost}`}
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cashier Product Grid */}
        {userRole !== 'admin' && (
          <div className={`flex-1 overflow-y-auto p-6 ${theme.bg.main}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className={`${COMMON_STYLES.card(isDarkMode)} rounded-2xl p-5 relative overflow-hidden group transition-all flex flex-col ${theme.border.hover}`}
                >
                  <div className="absolute top-4 left-4">
                    <span className={`${COMMON_STYLES.badge(isDarkMode)} uppercase text-[10px]`}>
                      {product.category}
                    </span>
                  </div>

                  <div className="mt-8 flex-1">
                    <h3 className={`text-lg font-semibold mb-1 line-clamp-2 ${theme.text.main}`}>
                      {product.name}
                    </h3>
                    <div className={`flex items-center gap-2 text-sm ${theme.text.secondary}`}>
                      <Box size={14} />
                      <span>Stock: {product.stock}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className={`text-xs font-medium mb-0.5 ${theme.text.secondary}`}>Price</p>
                      <p className={`text-xl font-semibold font-mono ${theme.text.main}`}>₹{product.price}</p>
                    </div>
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock <= 0}
                      className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all active:scale-95 ${product.stock > 0 ? theme.button.primary : `${theme.bg.subtle} ${theme.text.muted} cursor-not-allowed`}`}
                    >
                      <Plus size={18} strokeWidth={3} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE: CART (Only for Cashier) --- */}
      {userRole !== 'admin' && (
        <div className={`w-96 border-l flex flex-col z-10 ${theme.bg.card} ${theme.border.default}`}>
          
          {/* Cart Header */}
          <div className={`p-6 border-b flex items-center justify-between ${theme.bg.card} ${theme.border.default}`}>
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} />
              <h2 className={`text-2xl font-semibold tracking-tight ${theme.text.main}`}>Order</h2>
            </div>
            <div className={`px-3 py-1 rounded-lg border ${theme.bg.card} ${theme.border.default}`}>
              <span className={`text-xs font-medium uppercase mr-2 ${theme.text.secondary}`}>Token</span>
              <select
                value={selectedToken}
                onChange={(e) => onSetToken(e.target.value)}
                className={`font-semibold outline-none appearance-none cursor-pointer bg-transparent ${theme.text.main}`}
              >
                {availableTokens.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Cart Items */}
          <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${theme.bg.main}`}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[40vh] space-y-4">
                <ShoppingCart size={64} className={theme.text.muted} />
                <p className={`font-medium ${theme.text.secondary}`}>Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-2xl p-4 flex items-center justify-between group transition-all ${COMMON_STYLES.card(isDarkMode)}`}
                >
                  <div className="flex-1 pr-4">
                    <h4 className={`font-medium mb-1 ${theme.text.main}`}>{item.name}</h4>
                    <p className={`text-sm font-mono ${theme.text.main}`}>₹{item.price}</p>
                  </div>
                  <div className={`flex items-center gap-3 p-1 rounded-xl border ${theme.bg.main} ${theme.border.default}`}>
                    <button 
                      onClick={() => onRemoveFromCart(item)} 
                      className={`p-2 rounded-lg transition-all ${theme.button.ghost}`}
                    >
                      {item.quantity === 1 ? <Trash2 size={18} /> : <Minus size={18} strokeWidth={3} />}
                    </button>
                    <span className={`font-semibold w-6 text-center ${theme.text.main}`}>{item.quantity}</span>
                    <button 
                      onClick={() => onAddToCart(item)} 
                      className={`p-2 rounded-lg transition-all ${theme.button.ghost}`}
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className={`p-6 border-t ${theme.bg.card} ${theme.border.default}`}>
            <div className="space-y-3 mb-6">
              <div className={`flex justify-between font-medium ${theme.text.secondary}`}>
                <span>Subtotal</span>
                <span className="font-mono">₹{cartSubtotal}</span>
              </div>
              <div className={`flex justify-between font-medium items-center ${theme.text.secondary}`}>
                <span>Discount</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, e.target.value))}
                  className={`w-20 ${COMMON_STYLES.input(isDarkMode)} py-1 px-2 text-right font-mono text-sm`}
                />
              </div>
              <div className={`flex justify-between font-medium ${theme.text.secondary}`}>
                <span>GST ({taxRate}%)</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-semibold text-xl pt-3 border-t ${theme.text.main} ${theme.border.default}`}>
                <span>Total</span>
                <span className="font-mono">₹{grandTotal}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${cart.length > 0 ? theme.button.primary : `${theme.bg.subtle} ${theme.text.muted} cursor-not-allowed`}`}
            >
              Checkout & Call Token {selectedToken}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}