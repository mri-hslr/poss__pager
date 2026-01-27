const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // ✅ Correct path to database

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// 1. SIGNUP (Create User)
exports.signup = (req, res) => {
    const { username,email, password, role } = req.body;

    if (!username|| !email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user exists
    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
        if (err) {
            console.error("Signup DB Error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userRole = role || 'cashier';

            // Insert new user
            const insertQuery = 'INSERT INTO users (username,email, password, role) VALUES (?,?, ?, ?)';
            db.query(insertQuery, [username,email, hashedPassword, userRole], (err, result) => {
                if (err) {
                    console.error("Insert User Error:", err);
                    return res.status(500).json({ message: "Error registering user" });
                }
                res.status(201).json({ message: "User created successfully" });
            });
        } catch (error) {
            console.error("Hashing Error:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
};

// 2. LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error("Login DB Error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        const user = results[0];

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create Token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role }, 
            SECRET_KEY, 
            { expiresIn: '24h' }
        );

        // Send back user info (including ID, which is now in your DB)
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username,
                email: user.email, 
                role: user.role 
            } 
        });
    });
};

// 3. GET ALL USERS (Fixed)
exports.getAllUsers = (req, res) => {
    // This query caused your crash because 'id' was missing. Step 1 fixes this.
    const query = "SELECT id, username,email, role FROM users";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Fetch Users Error:", err);
            return res.status(500).json({ message: "Database error fetching users" });
        }
        res.json(results);
    });
};

// 4. DELETE USER
exports.deleteUser = (req, res) => {
    const userId = req.params.id;
    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) {
            console.error("Delete User Error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ message: "User deleted successfully" });
    });
};