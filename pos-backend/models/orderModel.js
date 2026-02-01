const db = require('../db');

const orderModel = {
    // 1. Create Order
    createOrder: (total, method, token, restaurantId) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO orders 
                (total, payment_method, token, restaurant_id, payment_status, created_at) 
                VALUES (?, ?, ?, ?, 'pending', NOW())
            `;
            db.query(query, [total, method, token, restaurantId], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    },

    // 2. Add Items
    addOrderItem: (orderId, item) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)`;
            db.query(query, [orderId, item.productId, item.name, item.price, item.quantity], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    // 3. Complete Order
    completeOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            // ✅ We are setting it to 'paid' now
            const query = "UPDATE orders SET payment_status = 'paid' WHERE id = ?";
            db.query(query, [orderId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },

    // ✅ 4. Get Sales History (THE FIX)
    getSalesHistory: () => {
        return new Promise((resolve, reject) => {
            // We fetch orders that are 'paid' OR 'completed' (in case you have old data)
            const query = `
                SELECT o.id, o.token, o.created_at, o.total, o.payment_method, o.payment_status,
                       oi.name as product_name, oi.quantity, oi.price
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status IN ('paid', 'completed') 
                ORDER BY o.created_at DESC
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
};

module.exports = orderModel;