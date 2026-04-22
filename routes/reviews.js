const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { verifyToken } = require('../middleware/auth');

// POST /reviews/get/:productId
router.post('/get/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /reviews/add
router.post('/add', verifyToken, async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json({ message: "Review added successfully!", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /reviews/delete/:reviewId
router.post('/delete/:reviewId', verifyToken, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: "Review deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;