const express = require('express');
const router = express.Router();
const Favourite = require('../models/Favourite');
const { verifyToken } = require('../middleware/auth');

// POST /favourites/get/:userId
router.post('/get/:userId', verifyToken, async (req, res) => {
  try {
    const fav = await Favourite.findOne({ userId: req.params.userId })
      .populate('products');
    res.json(fav || { products: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /favourites/add/:userId/:productId
router.post('/add/:userId/:productId', verifyToken, async (req, res) => {
  try {
    let fav = await Favourite.findOne({ userId: req.params.userId });
    if (!fav) fav = new Favourite({ userId: req.params.userId, products: [] });

    const alreadyAdded = fav.products.some(
      p => p.toString() === req.params.productId
    );
    if (!alreadyAdded) fav.products.push(req.params.productId);

    await fav.save();
    res.json({ message: "Added to favourites!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /favourites/remove/:userId/:productId
router.post('/remove/:userId/:productId', verifyToken, async (req, res) => {
  try {
    const fav = await Favourite.findOne({ userId: req.params.userId });
    if (fav) {
      fav.products = fav.products.filter(
        p => p.toString() !== req.params.productId
      );
      await fav.save();
    }
    res.json({ message: "Removed from favourites!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;