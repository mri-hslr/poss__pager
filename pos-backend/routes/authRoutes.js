const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// ✅ NEW: User Management Routes
// This connects the Admin Dashboard to the Database
router.get('/users', authController.getAllUsers); 
router.delete('/users/:id', authController.deleteUser);

module.exports = router;