const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Auth
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Admin user management
router.get("/users", authController.getAllUsers);
router.delete("/users/:id", authController.deleteUser);

module.exports = router;