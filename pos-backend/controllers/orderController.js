const db = require('../db');
const orderModel = require('../models/orderModel');
const settingsModel = require('../models/settingsModel');
const QRCode = require('qrcode');

// --- 1. Create Order (Checkout) ---
async function createOrder(req, res) {
  const { items, paymentMethod, financials, token } = req.body;

  if (!items?.length || !token) {
      return res.status(400).json({ message: "Invalid order data" });
  }

  const method = String(paymentMethod || 'cash').toLowerCase();

  try {
    const total = financials ? Number(financials.finalPayable) : 0;
    
    // 1. Save to DB
    const orderId = await orderModel.createOrder(total, method, token);
    
    // 2. Save Items
    const itemPromises = items.map(item => 
        orderModel.addOrderItem(orderId, {
            productId: item.productId ?? item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })
    );
    await Promise.all(itemPromises);

    // 3. Generate UPI (If needed)
    let upi = null;
    if (method === "upi") {
         try {
             let upiId = "example@upi"; 
             let payee = "Merchant";
             const settings = await settingsModel.getSettings();
             if (settings?.upi_id) { 
                 upiId = settings.upi_id; 
                 payee = settings.payee_name; 
             }
             const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${total}&cu=INR&tn=Order%20${orderId}`;
             const qrBase64 = await QRCode.toDataURL(upiLink);
             upi = { qr: qrBase64, payee: payee };
         } catch(e) { console.error("UPI Gen Error", e); }
    }

    // Success! (Frontend will handle the Dock signal now)
    res.json({ message: "Success", orderId, token, upi });

  } catch (err) {
    console.error("❌ Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// --- 2. Get Active Orders (Kitchen View) ---
async function getActiveOrders(req, res) {
    const query = `
        SELECT o.id, o.token, o.created_at, oi.product_name, oi.quantity 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        ORDER BY o.created_at ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Fetch Orders Error:", err);
            return res.status(500).json([]);
        }
        
        const ordersMap = {};
        results.forEach(row => {
            if (!ordersMap[row.id]) {
                ordersMap[row.id] = {
                    id: row.id,
                    token: row.token,
                    startedAt: row.created_at,
                    items: []
                };
            }
            ordersMap[row.id].items.push({ name: row.product_name, quantity: row.quantity });
        });
        res.json(Object.values(ordersMap));
    });
}

// --- 3. Delete Order (Mark Ready) ---
async function deleteOrder(req, res) {
    const orderId = req.params.id;
    
    // First delete items, then the order (Foreign Key fix)
    db.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
        if (err) {
            console.error("Delete Items Error:", err);
            return res.status(500).json({ message: "DB Error" });
        }
        
        db.query('DELETE FROM orders WHERE id = ?', [orderId], (err2) => {
            if (err2) {
                console.error("Delete Order Error:", err2);
                return res.status(500).json({ message: "DB Error" });
            }
            res.json({ msg: "Order Cleared" });
        });
    });
}

// ✅ Export all functions so the server can see them
module.exports = { createOrder, getActiveOrders, deleteOrder };