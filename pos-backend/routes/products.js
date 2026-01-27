const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products
router.get('/', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json({ message: "DB Error" });
        res.json(results);
    });
});

// ✅ ADD Product
router.post('/', (req, res) => {
    const { name, price, category } = req.body;
    const query = "INSERT INTO products (name, price, category) VALUES (?, ?, ?)";
    db.query(query, [name, price, category], (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to add product" });
        res.json({ id: result.insertId, message: "Product added" });
    });
});

// ✅ UPDATE Product
router.put('/:id', (req, res) => {
    const { name, price, category } = req.body;
    const query = "UPDATE products SET name=?, price=?, category=? WHERE id=?";
    db.query(query, [name, price, category, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update" });
        res.json({ message: "Product updated" });
    });
});

// ✅ DELETE Product
router.delete('/:id', (req, res) => {
    db.query("DELETE FROM products WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete" });
        res.json({ message: "Product deleted" });
    });
});

module.exports = router;