const db = require('../db');

// ✅ Updated to accept 'token'
function createOrder(totalAmount, paymentMethod, token) {
  return new Promise((resolve, reject) => {
    // Make sure your database has a 'token' column!
    const query = `
      INSERT INTO orders (total_amount, payment_method, token)
      VALUES (?, ?, ?)
    `;
    db.query(query, [totalAmount, paymentMethod, token], (err, result) => {
      if (err) reject(err);
      else resolve(result.insertId);
    });
  });
}

function addOrderItem(orderId, item) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO order_items 
      (order_id, product_id, product_name, price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        orderId,
        item.productId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity
      ],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

module.exports = { createOrder, addOrderItem };