const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

console.log("✅ Order Routes Loaded");

// 1. Create Order
// Uses: orderController.createOrder
router.post('/', authMiddleware, orderController.createOrder);

// 2. Get All Active Orders (Kitchen)
// Uses: orderController.getActiveOrders
router.get('/', authMiddleware, orderController.getActiveOrders);

// 3. Delete/Complete Order
// Uses: orderController.deleteOrder
router.delete('/:id', authMiddleware, orderController.deleteOrder);

// ❌ REMOVED: router.post('/call-token', ...) 
// The frontend now handles the USB connection directly, so this route is dead.

module.exports = router;