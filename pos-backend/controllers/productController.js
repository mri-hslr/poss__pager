const productModel = require("../models/productModel");

// CREATE
async function addProduct(req, res) {
  const { name, price, stock, category } = req.body;

  if (!name || price == null || stock == null) {
    return res.status(400).json({ message: "invalid input" });
  }

  try {
    const result = await productModel.addProduct(name, price, stock, category);
    res.status(201).json({ message: "product added", productId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
}

// READ
async function getAllProducts(req, res) {
  try {
    const products = await productModel.getAllProducts();
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
}

// UPDATE
async function updateProduct(req, res) {
  const id = req.params.id;
  const { name, price, stock, category } = req.body;

  if (!name || price == null || stock == null) {
    return res.status(400).json({ message: "invalid input" });
  }

  try {
    await productModel.updateProduct(id, name, price, stock, category);
    res.json({ message: "product updated" });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
}

// DELETE
async function deleteProduct(req, res) {
  const id = req.params.id;

  try {
    await productModel.deleteProduct(id);
    res.json({ message: "product deleted" });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};