const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

console.log("✅ Order Routes Loaded");

// 1. GET all active orders (Kitchen View)
router.get("/", orderController.getActiveOrders); 

// 2. Create a new order (Checkout)
router.post("/", orderController.createOrder);

// 3. Call a customer (Bell Button)
router.post("/call-token", orderController.callToken);

// 4. Mark SINGLE order as ready
router.delete("/:id", orderController.deleteOrder);

// ❌ REMOVED: router.post("/:id/assign-token", ...) 
// We removed this legacy route because the function no longer exists.

module.exports = router;