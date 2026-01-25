const express = require('express');
const productController = require('../controllers/productController');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Only admin can modify products
router.post('/', authorizeRoles('admin'), productController.addProduct);
router.put('/:id', authorizeRoles('admin'), productController.updateProduct);
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

// Everyone can view
router.get('/', authorizeRoles('admin', 'manager', 'cashier'), productController.getAllProducts);

module.exports = router;