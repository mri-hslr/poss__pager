const orderModel = require("../models/orderModel");
const storeSettingsModel = require("../models/settingsModel");
const db = require("../db");
const QRCode = require("qrcode");

// ---------------- CREATE ORDER ----------------
exports.createOrder = async (req, res) => {
  const { items, paymentMethod } = req.body;
  const restaurantId = req.user.restaurantId;

  if (!items || !items.length) {
    return res.status(400).json({ message: "No items" });
  }

  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const orderId = await orderModel.createOrder({
    restaurantId,
    total,
    paymentMethod
  });

  for (const item of items) {
    await orderModel.addOrderItem({
      orderId,
      productId: item.productId,
      price: item.price,
      quantity: item.quantity
    });
  }

  let upi = null;

  if (paymentMethod === "upi") {
    const settings = await storeSettingsModel.getSettings(restaurantId);

    if (!settings) {
      return res.status(500).json({ message: "UPI not configured" });
    }

    const upiLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(
      settings.payee_name
    )}&am=${total}&cu=INR&tr=ORD${orderId}`;

    upi = {
      link: upiLink,
      qr: await QRCode.toDataURL(upiLink)
    };
  }

  res.json({ orderId, total, upi });
};

// ---------------- GET ACTIVE ORDERS (KITCHEN) ----------------
exports.getActiveOrders = async (req, res) => {
  const restaurantId = req.user.restaurantId;

  const [orders] = await db.query(
    `
    SELECT o.id, o.total, o.status, o.created_at
    FROM orders o
    WHERE o.restaurant_id = ?
      AND o.status = 'PENDING'
    ORDER BY o.created_at ASC
    `,
    [restaurantId]
  );

  res.json(orders);
};

// ---------------- DELETE / COMPLETE ORDER ----------------
exports.deleteOrder = async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const orderId = req.params.id;

  await db.query(
    `
    DELETE FROM orders
    WHERE id = ? AND restaurant_id = ?
    `,
    [orderId, restaurantId]
  );

  res.json({ message: "Order completed" });
};