const express = require('express');
const cors = require('cors');
const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 3000;
// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settingsRoutes');

// --- Import Route Guards ---
const authMiddleware = require('./middleware/authMiddleware');

// --- Register Routes ---
app.use('/auth', authRoutes); // Public (Login/Signup)

// Protected Routes (Require Login)
app.use('/orders', authMiddleware, orderRoutes);
app.use('/products', authMiddleware, productRoutes);
app.use('/settings', authMiddleware, settingsRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});