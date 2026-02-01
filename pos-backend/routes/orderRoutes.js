const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 1. Create Order
router.post('/', orderController.createOrder);

// 2. Get Active Orders
router.get('/', orderController.getActiveOrders);

// 3. Complete Order
// ⚠️ IMPORTANT: This must match ':id' exactly so the controller can read it
router.get('/history', orderController.getSalesHistory);
router.put('/:id/complete', orderController.completeOrder);

module.exports = router;