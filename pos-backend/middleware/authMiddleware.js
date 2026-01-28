const jwt = require("jsonwebtoken");

// ✅ FIX: Check process.env first!
// This MUST match the key in authController.js exactly.
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

function authMiddleware(req, res, next) {
  // 1. Get Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 2. Extract token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = parts[1];

  try {
    // 3. Verify token using the SHARED secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Attach user to request
    req.user = decoded;

    // 5. Allow request to continue
    next();
  } catch (err) {
    console.error("Auth Verification Failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;