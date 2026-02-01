const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products
router.get('/', (req, res) => {
    const restaurantId = req.query.restaurantId;
    let query = "SELECT * FROM products";
    let params = [];

    if (restaurantId) {
        query += " WHERE restaurant_id = ?";
        params.push(restaurantId);
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error("❌ GET Error:", err);
            return res.status(500).json({ message: "DB Error" });
        }
        res.json(results);
    });
});

// ✅ ADD Product (FIXED)
router.post('/', (req, res) => {
    console.log("📝 Received Body:", req.body); // Log what we received

    const { name, price, category, stock, restaurantId } = req.body;

    // Default values if missing
    const safeStock = stock || 0;
    const safeRestaurantId = restaurantId || 1; 

    // ✅ FIX: Added restaurant_id and stock to the INSERT
    const query = "INSERT INTO products (name, price, category, stock, restaurant_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
    
    db.query(query, [name, price, category, safeStock, safeRestaurantId], (err, result) => {
        if (err) {
            // 🛑 THIS LOG WILL TELL YOU THE REAL ERROR
            console.error("❌ INSERT Error:", err.sqlMessage || err);
            return res.status(500).json({ message: "Failed to add product", error: err.sqlMessage });
        }
        res.json({ id: result.insertId, message: "Product added" });
    });
});

// Update Product
router.put('/:id', (req, res) => {
    const { name, price, category, stock } = req.body;
    const query = "UPDATE products SET name=?, price=?, category=?, stock=? WHERE id=?";
    db.query(query, [name, price, category, stock, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update" });
        res.json({ message: "Product updated" });
    });
});

// Delete Product
router.delete('/:id', (req, res) => {
    db.query("DELETE FROM products WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete" });
        res.json({ message: "Product deleted" });
    });
});

module.exports = router;