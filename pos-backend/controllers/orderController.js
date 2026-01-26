const orderModel = require('../models/orderModel');
const settingsModel = require('../models/settingsModel');
const QRCode = require('qrcode');

async function createOrder(req, res) {
  const { items, paymentMethod, financials } = req.body;

  console.log("Backend Received:", { paymentMethod }); // Debug Log

  if (!items || !items.length) {
    return res.status(400).json({ message: "No items" });
  }

  // Force method to string to prevent crashes
  const method = String(paymentMethod || 'cash').toLowerCase();

  try {
    const total = financials ? Number(financials.finalPayable) : 0;
    const orderId = await orderModel.createOrder(total, method);

    for (const item of items) {
        await orderModel.addOrderItem(orderId, {
          productId: item.productId ?? item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        });
    }

    let upi = null;

    // ✅ FORCE QR GENERATION FOR UPI
    if (method === "upi") {
        let upiId = "aakash@okaxis";
        let payee = "Aakash";

        try {
            const settings = await settingsModel.getSettings();
            if (settings?.upi_id) {
                upiId = settings.upi_id;
                payee = settings.payee_name;
            }
        } catch (e) {
            console.log("Using Default UPI Settings due to DB error");
        }
      
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${total}&cu=INR&tn=Order%20${orderId}`;
        const qrBase64 = await QRCode.toDataURL(upiLink);
      
        upi = { qr: qrBase64, payee: payee };
    }

    res.json({
      message: "Order created",
      orderId,
      total,
      upi // If method was UPI, this will be populated
    });

  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createOrder };