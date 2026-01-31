const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ======================= SIGNUP =======================
exports.signup = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Check if user exists
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ message: "User already exists" });
    }

    // 2️⃣ Create restaurant (only for admin signup)
    const [restaurantResult] = await conn.query(
      "INSERT INTO restaurants (name, email) VALUES (?, ?)",
      [`${username}'s Restaurant`, email]
    );

    const restaurantId = restaurantResult.insertId;

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create user
    await conn.query(
      `INSERT INTO users (restaurant_id, username, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [restaurantId, username, email, hashedPassword, role || "admin"]
    );

    await conn.commit();

    res.status(201).json({ message: "Signup successful" });

  } catch (err) {
    await conn.rollback();
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

// ======================= LOGIN =======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      restaurantId: user.restaurant_id
    }
  });
};
// ======================= GET ALL USERS =======================
exports.getAllUsers = async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT id, username, email, role FROM users"
      );
      res.json(rows);
    } catch (err) {
      console.error("Get users error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  // ======================= DELETE USER =======================
  exports.deleteUser = async (req, res) => {
    try {
      await db.query(
        "DELETE FROM users WHERE id = ?",
        [req.params.id]
      );
      res.json({ message: "User deleted" });
    } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };