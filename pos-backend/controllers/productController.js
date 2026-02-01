const db = require('../db'); 

// 1. Get All Products
exports.getAllProducts = (req, res) => {
    try {
        const restaurantId = req.query.restaurantId;

        let query = "SELECT * FROM products";
        let params = [];

        // ✅ CRASH FIX: Ensure we never pass 'undefined' to SQL
        if (restaurantId && restaurantId !== 'undefined' && restaurantId !== 'null') {
            query += " WHERE restaurant_id = ?";
            params.push(restaurantId);
        }
        
        query += " ORDER BY created_at DESC";

        db.query(query, params, (err, results) => {
            if (err) {
                console.error("❌ DB Error in getAllProducts:", err.message);
                return res.json([]); // Return empty list instead of crashing
            }
            res.json(results);
        });
    } catch (err) {
        console.error("🔥 Critical Crash in getAllProducts:", err.message);
        res.status(500).json({ message: "Server Logic Error" });
    }
};

// 2. Add Product (With Stock)
exports.createProduct = (req, res) => {
    try {
        console.log("📝 Incoming Product Data:", req.body);

        const { name, category, price, restaurantId, stock } = req.body;

        // ✅ CRASH FIX: Default values to prevent 'undefined'
        const safeName = name || "Unnamed Product";
        const safeCategory = category || "General";
        const safePrice = price || 0;
        const safeRestaurantId = restaurantId || 1; // Default to 1 if missing
        const safeStock = stock || 0;

        const query = "INSERT INTO products (name, category, price, restaurant_id, stock, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
        
        // Pass only SAFE variables
        db.query(query, [safeName, safeCategory, safePrice, safeRestaurantId, safeStock], (err, result) => {
            if (err) {
                console.error("❌ DB Error in createProduct:", err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log("✅ Product Created Successfully, ID:", result.insertId);
            res.json({ message: "Product added", id: result.insertId });
        });
    } catch (err) {
        console.error("🔥 Critical Crash in createProduct:", err.message);
        res.status(500).json({ message: "Server Logic Error" });
    }
};

// 3. Delete Product
exports.deleteProduct = (req, res) => {
    db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
};

// 4. Update Product
exports.updateProduct = (req, res) => {
    const { name, category, price, stock } = req.body;
    const query = "UPDATE products SET name=?, category=?, price=?, stock=? WHERE id=?";
    db.query(query, [name, category, price, stock, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated" });
    });
};