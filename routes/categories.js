const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { verifyAdmin } = require('../middleware/auth');

// POST /categories/get
router.post('/get', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /categories/add  — Admin only
router.post('/add', verifyAdmin, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ message: "Category added successfully!", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /categories/delete/:categoryId  — Admin only
router.post('/delete/:categoryId', verifyAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.categoryId);
    res.json({ message: "Category deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;