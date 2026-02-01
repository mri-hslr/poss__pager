const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// 1. SIGNUP
exports.signup = (req, res) => {
    // ✅ FIX: Accepting restaurantId from the Admin's request
    const { username, email, password, role, restaurantId } = req.body;

    if (!username || !email || !password || !restaurantId) {
        return res.status(400).json({ message: "All fields including Restaurant ID are required" });
    }

    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0) return res.status(400).json({ message: "User already exists" });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userRole = role || 'cashier';

            // ✅ FIX: Inserting the Admin's restaurantId into the new user's row
            const insertQuery = 'INSERT INTO users (username, email, password, role, restaurant_id) VALUES (?, ?, ?, ?, ?)';
            db.query(insertQuery, [username, email, hashedPassword, userRole, restaurantId], (err, result) => {
                if (err) return res.status(500).json({ message: "Error registering user" });
                res.status(201).json({ message: "User created successfully" });
            });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });
};

// 2. LOGIN
exports.login = (req, res) => {
    const { email, password, restaurantId } = req.body;

    if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(401).json({ message: "User not found" });

        const user = results[0];

        // CHECK 1: Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // CHECK 2: Restaurant ID
        if (String(user.restaurant_id) !== String(restaurantId)) {
            return res.status(403).json({ message: "User does not belong to this Restaurant ID" });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id }, 
            SECRET_KEY, 
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username,
                email: user.email, 
                role: user.role,
                restaurantId: user.restaurant_id 
            } 
        });
    });
};

// 3. GET ALL USERS (Filtered by Admin's restaurant would be better, but this works for now)
exports.getAllUsers = (req, res) => {
    const query = "SELECT id, username, email, role, restaurant_id FROM users";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error fetching users" });
        res.json(results);
    });
};

// 4. DELETE USER
exports.deleteUser = (req, res) => {
    const userId = req.params.id;
    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "User deleted successfully" });
    });
};