const orderModel = require('../models/orderModel');
const QRCode = require('qrcode');
async function createOrder(req, res) {
  const { items, paymentMethod } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: "No items" });
  }

  if (!['upi', 'cash', 'card'].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  try {
    const total = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    console.log("REQ BODY:", JSON.stringify(req.body, null, 2));
    const orderId = await orderModel.createOrder(total, paymentMethod);

    for (const item of items) {
        const normalizedItem = {
          productId: item.productId ?? item.id,   // ✅ THIS IS THE FIX
          name: item.name,
          price: item.price,
          quantity: item.quantity
        };
      
        if (!normalizedItem.productId) {
          console.error("🚨 Invalid item:", item);
          throw new Error("Missing productId");
        }
      
        await orderModel.addOrderItem(orderId, normalizedItem);
      }
    let upi = null;

    if (paymentMethod === "upi") {
        const settings = await settingsModel.getSettings();
      
        if (!settings?.upi_id || !settings?.payee_name) {
          return res.status(500).json({ message: "UPI not configured" });
        }
      
        const upiLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.payee_name)}&am=${total}&cu=INR&tn=Order%20${orderId}&tr=ORD${orderId}`;
      
        const qrBase64 = await QRCode.toDataURL(upiLink);
      
        upi = {
          link: upiLink,
          qr: qrBase64
        };
      }

    res.json({
      message: "Order created",
      orderId,
      total,
      paymentStatus: "pending",
      upi
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createOrder };