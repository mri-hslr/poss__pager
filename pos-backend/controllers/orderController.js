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

    const orderId = await orderModel.createOrder(total, paymentMethod);

    for (const item of items) {
      await orderModel.addOrderItem(orderId, item);
    }

    let upi = null;

    if (paymentMethod === "upi") {
      const upiId = "mridulbhardwaj13@okaxis";
      const payeeName = "Grid Sphere";

      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${total}&cu=INR&tn=Order%20${orderId}&tr=ORD${orderId}`;

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