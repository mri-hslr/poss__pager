import React, { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, Box, Edit2 } from "lucide-react";
import { getTheme, COMMON_STYLES, FONTS } from "./theme";

export default function POSView({
  menu,
  categories,
  cart,
  orders, 
  selectedCategory,
  setSelectedCategory,
  availableTokens,
  selectedToken,
  onSetToken,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  userRole,
  isDarkMode,
  discount,
  setDiscount,
  taxRate,

  /* admin props */
  isAddingItem,
  setIsAddingItem,
  newItem,
  setNewItem,
  isCreatingCategory,
  setIsCreatingCategory,
  handleAdminAddProduct,
  handleAdminUpdateProduct, 
  handleAdminDeleteProduct,
  rawProducts, 
}) {
  const theme = getTheme(isDarkMode);
  const [search, setSearch] = useState("");
  
  // State for Editing
  const [isEditing, setIsEditing] = useState(false);

  /* ===========================
      FILTERED PRODUCTS (Cashier)
     =========================== */
  const filteredProducts = useMemo(() => {
    let list = [];
    if (selectedCategory === "All" || !selectedCategory) {
      Object.values(menu).forEach(arr => (list = list.concat(arr)));
    } else {
      list = menu[selectedCategory] || [];
    }
    if (search) {
      list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [menu, selectedCategory, search]);

  /* Cart Totals */
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.max(0, cartSubtotal - discount) * (taxRate / 100);
  const grandTotal = Math.round(Math.max(0, cartSubtotal - discount) + taxAmount);

  // --- HANDLERS ---
  const startEdit = (product) => {
      setIsAddingItem(true);
      setIsEditing(true);
      setNewItem({
          name: product.name,
          price: product.price,
          stock: product.stock, 
          category: product.category,
          id: product.id 
      });
  };

  const handleSave = async () => {
      if (isEditing) {
          await handleAdminUpdateProduct(); 
      } else {
          await handleAdminAddProduct(); 
      }
      setIsEditing(false);
  };

  /* ===========================
      RENDER
     =========================== */
  return (
    <div className={`flex h-full ${theme.bg.main} ${theme.text.main}`} style={{ fontFamily: FONTS.sans }}>
      
      {/* ═══════════════ LEFT – MENU ═══════════════ */}
      <div className={`flex-1 flex flex-col border-r ${theme.border.default} ${theme.bg.main}`}>

        {/* Search + Tabs */}
        <div className={`p-4 border-b ${theme.border.default} space-y-3`}>
          <div className="relative max-w-2xl">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} />
            <input
              className={`w-full pl-10 ${COMMON_STYLES.input(isDarkMode)}`}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {["All", ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all
                  ${selectedCategory === cat ? `${theme.bg.active} ${theme.text.main}` : `${theme.button.ghost}`}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ===========================
            ADMIN ADD/EDIT FORM
           =========================== */}
        {userRole === "admin" && isAddingItem && (
          <div className="p-6 animate-in fade-in slide-in-from-top-4">
            <div className={`${COMMON_STYLES.card(isDarkMode)} p-6 space-y-4 border ${theme.border.default} shadow-lg rounded-xl`}>
              <h3 className="text-lg font-semibold mb-2">{isEditing ? "Edit Product" : "Add New Product"}</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                    <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Name</label>
                    <input className={COMMON_STYLES.input(isDarkMode)} placeholder="Burger" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                </div>
                
                <div className="col-span-1">
                    <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Price (₹)</label>
                    <input type="number" className={COMMON_STYLES.input(isDarkMode)} placeholder="0" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                </div>
                
                <div className="col-span-1">
                    <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Stock</label>
                    <input 
                        type="number" 
                        className={COMMON_STYLES.input(isDarkMode)} 
                        placeholder="0" 
                        value={newItem.stock} 
                        onChange={e => setNewItem({ ...newItem, stock: e.target.value })} 
                    />
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Category</label>
                    {isCreatingCategory ? (
                        <div className="flex gap-2">
                             <input className={COMMON_STYLES.input(isDarkMode)} placeholder="New Cat..." value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} autoFocus />
                             <button onClick={() => setIsCreatingCategory(false)} className={`px-2 ${theme.button.ghost}`}><Trash2 size={16}/></button>
                        </div>
                    ) : (
                        <select className={COMMON_STYLES.select(isDarkMode)} value={newItem.category} onChange={e => {
                            if (e.target.value === "__new__") { setIsCreatingCategory(true); setNewItem({ ...newItem, category: "" }); } 
                            else { setNewItem({ ...newItem, category: e.target.value }); }
                        }}>
                            <option value="">Select...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="__new__" className="font-bold text-blue-500">+ Create New</option>
                        </select>
                    )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t mt-4 border-dashed">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.button.secondary}`}
                  onClick={() => {
                    setIsAddingItem(false);
                    setIsCreatingCategory(false);
                    setIsEditing(false);
                    setNewItem({ name: '', price: '', category: '', stock: '', id: null });
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`px-6 py-2 rounded-lg text-sm font-medium shadow-md transition-all active:scale-95 ${theme.button.primary}`}
                  onClick={handleSave}
                >
                  {isEditing ? "Update Product" : "Save Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===========================
            ADMIN PRODUCT TABLE
           =========================== */}
        {userRole === "admin" && !isAddingItem && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold ${theme.text.main}`}>Inventory ({rawProducts.length})</h3>
              <button
                onClick={() => { setIsAddingItem(true); setIsEditing(false); setNewItem({ name: '', price: '', category: '', stock: '', id: null }); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-[0.97] ${theme.button.primary}`}
              >
                <Plus size={16} strokeWidth={2.5} /> Add Product
              </button>
            </div>

            {rawProducts.length === 0 ? (
              <div className={`rounded-lg border flex flex-col items-center justify-center py-16 ${COMMON_STYLES.card(isDarkMode)}`}>
                <div className={`p-4 rounded-xl mb-4 ${theme.bg.subtle}`}><Plus size={28} className={theme.text.secondary} /></div>
                <p className={`text-sm font-medium mb-1 ${theme.text.main}`}>No products yet</p>
                <button onClick={() => setIsAddingItem(true)} className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${theme.button.primary}`}>
                  <Plus size={15} strokeWidth={2.5} /> Add First Item
                </button>
              </div>
            ) : (
              <div className={`rounded-lg border overflow-hidden ${theme.border.default}`}>
                <table className="w-full text-sm text-left">
                  <thead className={`${theme.bg.subtle} ${theme.text.secondary} uppercase text-xs font-semibold`}>
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-gray-200'}`}>
                    {rawProducts.map(p => (
                      <tr key={p.id} className={`group hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                        <td className={`p-4 font-medium ${theme.text.main}`}>{p.name}</td>
                        <td className="p-4"><span className={COMMON_STYLES.badge(isDarkMode)}>{p.category}</span></td>
                        <td className="p-4"><div className="flex items-center gap-2"><Box size={14} className={p.stock < 5 ? "text-red-500" : theme.text.tertiary} /> {p.stock}</div></td>
                        <td className="p-4 font-mono">₹{p.price}</td>
                        <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(p)} className={`p-2 rounded-md hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors ${theme.text.secondary}`}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleAdminDeleteProduct(p.id)} className={`p-2 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300 transition-colors ${theme.text.secondary}`}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===========================
            CASHIER GRID
           =========================== */}
        {userRole !== "admin" && (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map(p => (
                <div key={p.id} className={`${COMMON_STYLES.card(isDarkMode)} p-4 flex flex-col border ${theme.border.hover} transition-all rounded-lg hover:shadow-md`}>
                  <span className={`${COMMON_STYLES.badge(isDarkMode)} text-[10px] mb-2 self-start`}>{p.category}</span>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{p.name}</h3>
                  <div className={`text-xs flex items-center gap-1 mb-3 ${theme.text.secondary}`}>
                    <Box size={12} /> {p.stock}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-semibold">₹{p.price}</span>
                    <button
                      disabled={p.stock <= 0}
                      onClick={() => onAddToCart(p)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all active:scale-95 ${p.stock <= 0 ? `${theme.bg.subtle} ${theme.text.muted} cursor-not-allowed` : theme.button.primary}`}
                    >
                      <Plus size={14} strokeWidth={2.5} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ RIGHT – CART (Cashier Only) ═══════════════ */}
      {userRole !== "admin" && (
        <div className={`w-96 border-l flex flex-col ${theme.bg.card} ${theme.border.default}`}>
          <div className={`p-6 border-b flex items-center justify-between ${theme.border.default}`}>
            <div className="flex items-center gap-3">
              <ShoppingCart size={22} className={theme.text.main} />
              <h2 className={`text-xl font-semibold ${theme.text.main}`}>Order</h2>
            </div>
            
            {/* ✅ FIXED TOKEN PICKER */}
            <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${theme.border.default} ${theme.bg.subtle}`}>
              <span className={`text-xs font-medium uppercase ${theme.text.secondary}`}>Token</span>
              <select 
                value={selectedToken} 
                onChange={e => onSetToken(e.target.value)} 
                className={`font-semibold outline-none bg-transparent cursor-pointer ${theme.text.main}`}
              >
                {availableTokens.map(t => (
                  // ✅ FIX: Force dark background on options so white text is visible
                  <option key={t} value={t} className="bg-zinc-800 text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-5 space-y-3 ${theme.bg.main}`}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[40vh] space-y-3">
                <ShoppingCart size={56} className={theme.text.muted} />
                <p className={`text-sm font-medium ${theme.text.secondary}`}>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className={`border rounded-lg p-4 flex items-center justify-between transition-all ${COMMON_STYLES.card(isDarkMode)} ${theme.border.hover}`}>
                  <div className="flex-1 pr-4">
                    <h4 className={`font-medium text-sm ${theme.text.main}`}>{item.name}</h4>
                    <p className={`text-sm font-mono ${theme.text.secondary}`}>₹{item.price}</p>
                  </div>
                  <div className={`flex items-center gap-2 p-1 rounded-lg border ${theme.bg.main} ${theme.border.default}`}>
                    <button onClick={() => onRemoveFromCart(item)} className={`p-1.5 rounded transition-colors ${theme.button.ghost}`}>
                      {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} strokeWidth={2.5} />}
                    </button>
                    <span className={`font-semibold w-5 text-center text-sm ${theme.text.main}`}>{item.quantity}</span>
                    <button onClick={() => onAddToCart(item)} className={`p-1.5 rounded transition-colors ${theme.button.ghost}`}>
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={`p-6 border-t ${theme.border.default} ${theme.bg.card}`}>
            <div className="space-y-3 mb-5">
              <div className={`flex justify-between text-sm font-medium ${theme.text.secondary}`}><span>Subtotal</span><span className="font-mono">₹{cartSubtotal}</span></div>
              <div className={`flex justify-between text-sm font-medium items-center ${theme.text.secondary}`}><span>Discount</span><input type="number" value={discount} onChange={e => setDiscount(Math.max(0, e.target.value))} className={`w-20 ${COMMON_STYLES.input(isDarkMode)} py-1 px-2 text-right font-mono text-sm`} /></div>
              <div className={`flex justify-between text-sm font-medium ${theme.text.secondary}`}><span>GST ({taxRate}%)</span><span className="font-mono">₹{taxAmount.toFixed(2)}</span></div>
              <div className={`flex justify-between font-semibold text-lg pt-3 border-t ${theme.text.main} ${theme.border.default}`}><span>Total</span><span className="font-mono">₹{grandTotal}</span></div>
            </div>
            <button onClick={onCheckout} disabled={cart.length === 0} className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${cart.length > 0 ? theme.button.primary : `${theme.bg.subtle} ${theme.text.muted} cursor-not-allowed`}`}>
              Checkout &amp; Call Token {selectedToken}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}