import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Check, Utensils, ChefHat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const RestaurantVendorUI = () => {
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('1');
  const [orders, setOrders] = useState([]);

  // Hardcoded menu with premium descriptions
  const menu = {
    "Starters": [
      { 
        id: 1, 
        name: "Paneer Tikka", 
        price: 180, 
        category: "Starters", 
        desc: "Cottage cheese marinated in aromatic spices, charred to perfection"
      },
      { 
        id: 2, 
        name: "Spring Rolls", 
        price: 120, 
        category: "Starters", 
        desc: "Crisp golden parcels filled with seasonal vegetables"
      },
      { 
        id: 3, 
        name: "Chicken Wings", 
        price: 220, 
        category: "Starters", 
        desc: "Tender wings glazed with house-made buffalo sauce"
      }
    ],
    "Main Course": [
      { 
        id: 4, 
        name: "Butter Chicken", 
        price: 280, 
        category: "Main Course", 
        desc: "Succulent chicken in velvety tomato & cream reduction"
      },
      { 
        id: 5, 
        name: "Dal Makhani", 
        price: 180, 
        category: "Main Course", 
        desc: "Black lentils slow-cooked overnight with butter & cream"
      },
      { 
        id: 6, 
        name: "Biryani", 
        price: 250, 
        category: "Main Course", 
        desc: "Fragrant basmati rice layered with aromatic spices",
        image: "🍚"
      },
      { 
        id: 7, 
        name: "Paneer Butter Masala", 
        price: 240, 
        category: "Main Course", 
        desc: "Cottage cheese in rich tomato-based curry"
      }
    ],
    "Breads": [
      { 
        id: 8, 
        name: "Naan", 
        price: 40, 
        category: "Breads", 
        desc: "Clay oven-baked leavened bread, pillowy soft"
      },
      { 
        id: 9, 
        name: "Roti", 
        price: 20, 
        category: "Breads", 
        desc: "Stone-ground whole wheat flatbread"
      },
      { 
        id: 10, 
        name: "Garlic Naan", 
        price: 60, 
        category: "Breads", 
        desc: "Naan brushed with roasted garlic butter"
          }
    ],
    "Beverages": [
      { 
        id: 11, 
        name: "Lassi", 
        price: 80, 
        category: "Beverages", 
        desc: "Traditional churned yogurt drink, subtly sweetened"
      },
      { 
        id: 12, 
        name: "Cold Drink", 
        price: 50, 
        category: "Beverages", 
        desc: "Chilled carbonated refreshment"
      },
      { 
        id: 13, 
        name: "Water Bottle", 
        price: 20, 
        category: "Beverages", 
        desc: "Purified still water"      }
    ]
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const newOrder = {
      id: Date.now(),
      token: selectedToken,
      items: [...cart],
      total: getCartTotal(),
      timestamp: new Date().toLocaleTimeString()
    };

    setOrders([...orders, newOrder]);
    setCart([]);
    
    const usedTokens = orders.map(o => o.token);
    for (let i = 1; i <= 10; i++) {
      if (!usedTokens.includes(i.toString())) {
        setSelectedToken(i.toString());
        break;
      }
    }
  };

  const pickupOrder = (orderId) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  const availableTokens = () => {
    const usedTokens = orders.map(o => o.token);
    return Array.from({length: 10}, (_, i) => (i + 1).toString())
      .filter(token => !usedTokens.includes(token));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="border-b-2 border-stone-900 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif text-stone-900 mb-2 tracking-tight">Culinary</h1>
              <p className="text-stone-600 text-sm uppercase tracking-widest">Vendor Order System</p>
            </div>
            <ChefHat className="text-stone-900" size={40} strokeWidth={1.5} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-8">
            {Object.entries(menu).map(([category, items]) => (
              <div key={category}>
                <div className="mb-6">
                  <h2 className="text-2xl font-serif text-stone-900 mb-1">{category}</h2>
                  <div className="w-16 h-0.5 bg-stone-900"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className="border-2 border-stone-300 bg-white p-5 hover:border-stone-900 transition-all cursor-pointer group relative"
                      onClick={() => addToCart(item)}
                    >
                      {/* Image placeholder */}
                      <div className="w-full aspect-[4/3] bg-stone-100 border border-stone-300 mb-4 flex items-center justify-center text-6xl">
                        {item.image}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-serif text-lg text-stone-900 leading-tight pr-2">
                            {item.name}
                          </h3>
                          <Button 
                            size="icon"
                            className="bg-stone-900 hover:bg-stone-700 h-9 w-9 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                          >
                            <Plus size={18} />
                          </Button>
                        </div>
                        
                        <p className="text-stone-600 text-sm leading-relaxed font-light">
                          {item.desc}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-stone-900 font-medium tracking-wide">
                            ₹{item.price}
                          </span>
                          {cart.find(c => c.id === item.id) && (
                            <Badge variant="outline" className="text-stone-900 border-stone-900 font-normal">
                              In cart: {cart.find(c => c.id === item.id).quantity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            <div className="border-2 border-stone-900 bg-white p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-300">
                <h2 className="text-xl font-serif text-stone-900">Current Order</h2>
                {cart.length > 0 && (
                  <Badge className="bg-stone-900 hover:bg-stone-700 font-normal">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                  </Badge>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="mx-auto text-stone-300 mb-3" size={48} strokeWidth={1.5} />
                  <p className="text-stone-400 font-light">Cart is empty</p>
                  <p className="text-sm text-stone-400 mt-1 font-light">Add items to begin</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="border border-stone-300 p-4 bg-stone-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-serif text-stone-900">{item.name}</h4>
                            <p className="text-xs text-stone-500 mt-1">₹{item.price} each</p>
                          </div>
                          <Button 
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-500 hover:text-stone-900 hover:bg-stone-200"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 border border-stone-300 bg-white">
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-stone-100"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-stone-100"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                          <span className="font-medium text-stone-900">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-stone-900 pt-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-700 uppercase tracking-wider text-sm">Total</span>
                      <span className="text-2xl font-serif text-stone-900">
                        ₹{getCartTotal()}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm text-stone-700 mb-2 uppercase tracking-wider">
                        Token Number
                      </label>
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger className="w-full border-2 border-stone-300 h-12 font-medium">
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTokens().map(token => (
                            <SelectItem key={token} value={token}>
                              Token {token}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={placeOrder}
                      className="w-full bg-stone-900 hover:bg-stone-700 text-white font-medium py-6 text-base uppercase tracking-widest"
                      size="lg"
                    >
                      Place Order
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active Orders */}
        {orders.length > 0 && (
          <div className="mt-12 pt-8 border-t-2 border-stone-900">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-stone-900 mb-1">Active Orders</h2>
              <div className="w-16 h-0.5 bg-stone-900"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => (
                <div key={order.id} className="border-2 border-stone-900 bg-white p-6">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-stone-300">
                    <div>
                      <div className="bg-stone-900 text-white font-serif text-2xl px-4 py-2 inline-block mb-2">
                        Token {order.token}
                      </div>
                      <p className="text-xs text-stone-500 uppercase tracking-wider">{order.timestamp}</p>
                    </div>
                    <Button 
                      onClick={() => pickupOrder(order.id)}
                      className="bg-stone-900 hover:bg-stone-700"
                      size="icon"
                      title="Mark as picked up"
                    >
                      <Check size={20} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-stone-700 font-light">
                          {item.name} <span className="text-stone-500">×{item.quantity}</span>
                        </span>
                        <span className="font-medium text-stone-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t-2 border-stone-900 pt-4 flex justify-between items-center">
                    <span className="text-stone-700 uppercase tracking-wider text-sm">Total</span>
                    <span className="text-xl font-serif text-stone-900">
                      ₹{order.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantVendorUI;