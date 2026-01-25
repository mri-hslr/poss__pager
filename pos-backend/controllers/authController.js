const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const JWT_SECRET = "supersecretkey"; 

function generateToken(user) {
  return jwt.sign(
    { userId: user.id || user.insertId, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

async function signup(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

  try {
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await userModel.createUser(name, email, hashedPassword, role || "cashier");

    // FIX: Generate Token Here
    const token = generateToken({ id: result.insertId, email, role: role || "cashier" });
    return res.status(201).json({ message: "User created successfully", token });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user);
    return res.status(200).json({ message: "Login successful", token });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { signup, login };