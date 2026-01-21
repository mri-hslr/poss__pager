const express=require('express');
const app=express();
const productRoutes=require('./routes/products');
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const cors = require("cors");
const userRoutes = require('./routes/userRoutes');
app.use(cors());
app.use(express.json());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.get('/',(req,res)=>{
    res.send('Point of Sale Backend is running');
})
app.use("/products",authMiddleware,productRoutes);
app.use("/auth", authRoutes);
const PORT=3000;
app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})