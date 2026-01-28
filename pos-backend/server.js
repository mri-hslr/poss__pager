const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARE ---
app.use(cors({
    origin: [
        "http://localhost:5173",             // Local Vite Frontend
        "https://poss-pager.vercel.app",     // Vercel Deployment (if you have one)
        "https://poss-pager.onrender.com"    // Render Backend (self)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (optional, if you use product images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 2. IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// --- 3. REGISTER ROUTES ---
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/settings', settingsRoutes);

// ❌ REMOVED: Dock/UART routes (Frontend handles USB now)

// --- 4. HEALTH CHECK ---
app.get('/', (req, res) => {
    res.json({ 
        message: "POS Backend is Online 🚀",
        mode: process.env.NODE_ENV || "development"
    });
});

// --- 5. START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🚀 Ready for Frontend connections`);
});