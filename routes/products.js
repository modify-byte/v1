const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { verifyAdmin } = require('../middleware/auth');

// POST /products/all
router.post('/all', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/single/:id
router.post('/single/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/search
router.post('/search', async (req, res) => {
  try {
    const { q } = req.body;
    if (!q) return res.status(400).json({ message: "Search query 'q' is required." });
    const products = await Product.find({ name: { $regex: q, $options: 'i' } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/category/:name
router.post('/category/:name', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.name });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/add  — Admin only
router.post('/add', verifyAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: "Product added successfully!", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/update/:id  — Admin only
router.post('/update/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product updated successfully!", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/delete/:id  — Admin only
router.post('/delete/:id', verifyAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;