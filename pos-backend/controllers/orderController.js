const db = require('../db');
const orderModel = require('../models/orderModel');

// 1. Create Order
async function createOrder(req, res) {
  try {
      const { items, paymentMethod, financials, token, restaurantId } = req.body;
      const total = financials ? Number(financials.finalPayable) : 0;
      const method = String(paymentMethod || 'cash').toLowerCase();
      const safeRestaurantId = restaurantId || 1; 

      const orderId = await orderModel.createOrder(total, method, token, safeRestaurantId);
      
      const itemPromises = items.map(item => 
          orderModel.addOrderItem(orderId, {
              productId: item.productId ?? item.id,
              name: item.name, 
              price: item.price,
              quantity: item.quantity
          })
      );
      await Promise.all(itemPromises);

      res.json({ message: "Success", orderId, token });
  } catch (err) {
      console.error("❌ Order Create Error:", err.message);
      res.status(500).json({ message: err.message });
  }
}

// 2. Get Active Orders
async function getActiveOrders(req, res) {
    const query = `
        SELECT o.id, o.token, o.created_at, 
               o.total, 
               o.payment_method, 
               o.payment_status,
               oi.name as product_name, 
               oi.quantity 
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.payment_status = 'pending' 
        ORDER BY o.created_at ASC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json([]);
        
        const ordersMap = {};
        results.forEach(row => {
            if (!ordersMap[row.id]) {
                ordersMap[row.id] = {
                    id: row.id,
                    token: row.token,
                    startedAt: row.created_at,
                    total: row.total, 
                    paymentMethod: row.payment_method,
                    items: []
                };
            }
            if (row.product_name) {
                ordersMap[row.id].items.push({ name: row.product_name, quantity: row.quantity });
            }
        });
        res.json(Object.values(ordersMap));
    });
}

// 3. Complete Order
async function completeOrder(req, res) {
    const orderId = parseInt(req.params.id);
    if (!orderId) return res.status(400).json({ message: "Invalid ID" });

    try {
        await orderModel.completeOrder(orderId);
        res.json({ msg: "Order Paid" });
    } catch (e) {
        console.error("Database Error:", e);
        res.status(500).json({ message: "DB Error" });
    }
}

// ✅ 4. Get Sales History (THE FIX)
async function getSalesHistory(req, res) {
    try {
        // Fetch raw data from DB
        const results = await orderModel.getSalesHistory();

        // Group items by order (just like Active Orders)
        const historyMap = {};
        results.forEach(row => {
            if (!historyMap[row.id]) {
                historyMap[row.id] = {
                    id: row.id,
                    token: row.token,
                    // Ensure date format is correct for frontend
                    completedAt: row.created_at, 
                    total: row.total,
                    paymentMethod: row.payment_method,
                    status: row.payment_status,
                    items: []
                };
            }
            if (row.product_name) {
                historyMap[row.id].items.push({ 
                    name: row.product_name, 
                    quantity: row.quantity,
                    price: row.price
                });
            }
        });

        res.json(Object.values(historyMap));
    } catch (e) {
        console.error("❌ History Error:", e);
        res.status(500).json({ message: "Failed to load history" });
    }
}

module.exports = { createOrder, getActiveOrders, completeOrder, getSalesHistory };