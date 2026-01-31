const db = require("../db");

async function createOrder({ restaurantId, total, paymentMethod }) {
  const [result] = await db.query(
    `INSERT INTO orders (restaurant_id, total, payment_method, status)
     VALUES (?, ?, ?, 'PENDING')`,
    [restaurantId, total, paymentMethod]
  );
  return result.insertId;
}

async function addOrderItem({ orderId, productId, price, quantity }) {
  const subtotal = price * quantity;

  await db.query(
    `INSERT INTO order_items
     (order_id, product_id, price, quantity, subtotal)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, productId, price, quantity, subtotal]
  );
}

module.exports = { createOrder, addOrderItem };