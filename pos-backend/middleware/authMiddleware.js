const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // later move to env

function authMiddleware(req, res, next) {
  // 1. Get Authorization header
  const authHeader = req.headers.authorization;

  // Example header:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
    // 3. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Attach user to request
    req.user = decoded;

    // 5. Allow request to continue
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
