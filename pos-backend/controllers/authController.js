const bcrypt = require("bcryptjs"); // <--- IMPORTANT: Must be bcryptjs
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel"); // Ensure this path is correct!

const JWT_SECRET = "supersecretkey"; 

// SIGNUP
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // 1. Check if user exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save user
    await userModel.createUser(name, email, hashedPassword, role || "cashier");

    return res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    console.error("Signup Crash Details:", err); // <--- LOOK AT TERMINAL IF THIS FAILS
    return res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      name: user.name,
      role: user.role
    });

  } catch (err) {
    console.error("Login Crash Details:", err);
    return res.status(500).json({ message: "Server error" });
  }
};