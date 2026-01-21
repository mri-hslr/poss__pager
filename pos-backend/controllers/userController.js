const db = require('../db');

// GET ALL USERS
exports.getAllUsers = (req, res) => {
  const sql = "SELECT id, name, email, role, created_at FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
};

// DELETE USER
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json({ message: "User deleted successfully" });
  });
};