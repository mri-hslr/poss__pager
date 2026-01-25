const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const tokenController = require("../controllers/tokenController"); // 👈 THIS WAS MISSING

console.log("✅ orderRoutes loaded");
router.post("/", orderController.createOrder);
router.post("/:orderId/assign-token", tokenController.assignToken);

module.exports = router;