import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  ChefHat,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RestaurantVendorUI = () => {
  const [cart, setCart] = useState([]);
  const [selectedToken, setSelectedToken] = useState('1');
  const [orders, setOrders] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const menu = {
    Starters: [
      { id: 1, name: 'Paneer Tikka', price: 180, desc: 'Grilled cottage cheese' },
      { id: 2, name: 'Spring Rolls', price: 120, desc: 'Veg crispy rolls' },
      { id: 3, name: 'Chicken Wings', price: 220, desc: 'Buffalo wings' },
      { id: 4, name: 'Veg Cutlet', price: 90, desc: 'Crispy veg patty' },
      { id: 5, name: 'French Fries', price: 80, desc: 'Classic fries' },
      { id: 6, name: 'Cheese Balls', price: 140, desc: 'Mozzarella bites' },
      { id: 7, name: 'Nachos', price: 160, desc: 'Cheese loaded' },
    ],
    'Main Course': [
      { id: 8, name: 'Butter Chicken', price: 280, desc: 'Creamy curry' },
      { id: 9, name: 'Dal Makhani', price: 180, desc: 'Slow cooked dal' },
      { id: 10, name: 'Paneer Butter Masala', price: 240, desc: 'Rich gravy' },
      { id: 11, name: 'Veg Biryani', price: 210, desc: 'Spiced rice' },
      { id: 12, name: 'Chicken Biryani', price: 260, desc: 'Hyderabadi style' },
      { id: 13, name: 'Kadhai Paneer', price: 230, desc: 'Spicy masala' },
      { id: 14, name: 'Rajma Chawal', price: 170, desc: 'Comfort food' },
    ],
    Breads: [
      { id: 15, name: 'Naan', price: 40, desc: 'Tandoor bread' },
      { id: 16, name: 'Butter Naan', price: 50, desc: 'Buttery naan' },
      { id: 17, name: 'Garlic Naan', price: 60, desc: 'Garlic topping' },
      { id: 18, name: 'Roti', price: 20, desc: 'Wheat roti' },
      { id: 19, name: 'Paratha', price: 45, desc: 'Layered bread' },
      { id: 20, name: 'Lachha Paratha', price: 55, desc: 'Crispy layers' },
    ],
    Beverages: [
      { id: 21, name: 'Cold Coffee', price: 120, desc: 'With ice cream' },
      { id: 22, name: 'Lassi', price: 80, desc: 'Sweet yogurt' },
      { id: 23, name: 'Lemon Soda', price: 60, desc: 'Refreshing' },
      { id: 24, name: 'Cold Drink', price: 50, desc: 'Chilled soda' },
      { id: 25, name: 'Water Bottle', price: 20, desc: 'Packaged water' },
    ],
  };

  const addToCart = (item) => {
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      setCart(cart.map((c) =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const placeOrder = () => {
    if (!cart.length) return;

    setOrders([
      ...orders,
      {
        id: Date.now(),
        token: selectedToken,
        items: cart,
        total,
      },
    ]);

    setCart([]);
    setCartOpen(false);
  };

  const availableTokens = () => {
    const used = orders.map((o) => o.token);
    return Array.from({ length: 20 }, (_, i) => `${i + 1}`).filter(
      (t) => !used.includes(t)
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center border-b-2 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif">Culinary</h1>
            <p className="text-xs tracking-widest text-stone-500">
              Vendor Order System
            </p>
          </div>
          <ChefHat size={32} />
        </div>

        {Object.entries(menu).map(([category, items]) => (
          <div key={category} className="mb-10">
            <h2 className="text-xl font-serif mb-3">{category}</h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="border p-2 bg-white cursor-pointer hover:border-stone-900"
                >
                  <div className="aspect-square bg-stone-100 mb-2" />
                  <h3 className="text-xs font-medium truncate">{item.name}</h3>
                  <p className="text-[10px] text-stone-500 truncate">{item.desc}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs">₹{item.price}</span>
                    {cart.find((c) => c.id === item.id) && (
                      <Badge variant="outline" className="text-[10px]">
                        {cart.find((c) => c.id === item.id).quantity}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      <div
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer shadow-lg"
      >
        <ShoppingCart size={16} />
        {cart.length} items
      </div>

      {/* Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full sm:w-[400px] h-full p-4 flex flex-col">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-serif">Current Order</h2>
              <X onClick={() => setCartOpen(false)} className="cursor-pointer" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="border p-2">
                  <div className="flex justify-between text-sm">
                    {item.name}
                    <Trash2 size={14} onClick={() => removeFromCart(item.id)} className="cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2 items-center">
                      <Button size="icon" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus size={12} />
                      </Button>
                      {item.quantity}
                      <Button size="icon" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus size={12} />
                      </Button>
                    </div>
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens().map((t) => (
                    <SelectItem key={t} value={t}>
                      Token {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button className="w-full" onClick={placeOrder}>
                Place Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantVendorUI;
