const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { verifyAdmin } = require('../middleware/auth');

// POST /banners/get
router.post('/get', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /banners/add  — Admin only
router.post('/add', verifyAdmin, async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json({ message: "Banner added successfully!", banner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /banners/delete/:bannerId  — Admin only
router.post('/delete/:bannerId', verifyAdmin, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.bannerId);
    res.json({ message: "Banner deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;