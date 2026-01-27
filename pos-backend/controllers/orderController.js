const db = require('../db');
const orderModel = require('../models/orderModel');
const settingsModel = require('../models/settingsModel');
const QRCode = require('qrcode');
const { sendTokenToESP } = require('../services/espService');

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

    // 3. Trigger ESP32 (Non-blocking)
    sendTokenToESP(token).catch(e => console.log("UART Silent Fail"));

    // 4. Generate UPI (If needed)
    let upi = null;
    if (method === "upi") {
         try {
             let upiId = "aakash@okaxis"; 
             let payee = "Aakash";
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
        if (err) return res.status(500).json([]);
        
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

// --- 3. Call Customer (Bell Button) ---
async function callToken(req, res) {
    const { token } = req.body;
    console.log(`📢 Manual Call: Token ${token}`);
    await sendTokenToESP(token);
    res.json({ success: true });
}

// --- 4. Mark Ready (Delete) ---
async function deleteOrder(req, res) {
    const orderId = req.params.id;
    db.query('DELETE FROM order_items WHERE order_id = ?', [orderId], () => {
        db.query('DELETE FROM orders WHERE id = ?', [orderId], () => res.json({ msg: "Cleared" }));
    });
}

module.exports = { createOrder, getActiveOrders, callToken, deleteOrder };