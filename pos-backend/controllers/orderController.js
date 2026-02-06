const db = require("../db");
const QRCode = require("qrcode");

// ---------------- 1. CREATE ORDER ----------------
exports.createOrder = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!items || !items.length) {
      return res.status(400).json({ message: "No items" });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Generate Token
    let token = 1;
    try {
        const [[{ maxToken }]] = await db.query(
          `SELECT MAX(token) AS maxToken FROM orders WHERE restaurant_id = ?`,
          [restaurantId]
        );
        token = (maxToken || 0) + 1;
    } catch (err) { 
        console.log("Token generation fallback"); 
    }

    // Insert Order
    const [result] = await db.query(
      `INSERT INTO orders (restaurant_id, total, payment_method, payment_status, token)
       VALUES (?, ?, ?, 'pending', ?)`,
      [restaurantId, total, paymentMethod, token]
    );
    const orderId = result.insertId;

    // Insert Items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name || 'Item', item.price, item.quantity]
      );
    }

    // Generate QR
    let upi = null;
    if (paymentMethod === "upi") {
      const [settingsRows] = await db.query(
          `SELECT upi_id, payee_name FROM store_settings WHERE restaurant_id = ?`, 
          [restaurantId]
      );
      const settings = settingsRows[0];
      if (settings && settings.upi_id) {
        const upiLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.payee_name)}&am=${parseFloat(total).toFixed(2)}&cu=INR&tr=ORD${orderId}`;
        upi = { link: upiLink, qr: await QRCode.toDataURL(upiLink) };
      }
    }

    res.json({ orderId, token, total, upi });

  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Create Failed: " + err.message });
  }
};

// ---------------- 2. GET ACTIVE ORDERS ----------------
exports.getActiveOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { status } = req.query;

    let query = `
      SELECT id, total, payment_method, payment_status, token, created_at
      FROM orders
      WHERE restaurant_id = ?`;
      
    // ✅ FIX: Only show 'pending' orders in the kitchen (Active view)
    // This ensures 'paid' orders disappear from the dashboard
    if (status === 'active') {
       query += ` AND payment_status = 'pending'`;
    }
    query += ` ORDER BY created_at ASC`;

    const [orders] = await db.query(query, [restaurantId]);
    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Fetch Failed: " + err.message });
  }
};

// ---------------- 3. GET SALES HISTORY ----------------
exports.getSalesHistory = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { date } = req.query; 

    if (!date) return res.status(400).json({ message: "Date required" });

    const [orders] = await db.query(
      `SELECT * FROM orders 
       WHERE restaurant_id = ? AND DATE(created_at) = ?
       ORDER BY created_at DESC`,
      [restaurantId, date]
    );

    for (let order of orders) {
      const [items] = await db.query(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error("History Error:", err);
    res.status(500).json({ message: "History Failed: " + err.message });
  }
};

// ---------------- 4. COMPLETE ORDER (Fixes 500 Error) ----------------
exports.deleteOrder = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const orderId = req.params.id;

    console.log(`Completing Order: ${orderId} for Restaurant: ${restaurantId}`);

    // ✅ FIX: Use 'paid' instead of 'completed'
    // This matches your database ENUM('pending', 'paid')
    const [result] = await db.query(
      "UPDATE orders SET payment_status = 'paid' WHERE id = ? AND restaurant_id = ?", 
      [orderId, restaurantId]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found or already completed" });
    }

    res.json({ message: "Order marked as paid" });

  } catch (err) {
    console.error("Delete Order Error:", err);
    res.status(500).json({ message: "Complete Failed: " + err.message });
  }
};