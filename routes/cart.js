const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { verifyToken } = require('../middleware/auth');

// POST /cart/get/:userId
router.post('/get/:userId', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate('products.productId');
    res.json(cart || { products: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /cart/add/:userId/:productId
router.post('/add/:userId/:productId', verifyToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = new Cart({ userId: req.params.userId, products: [] });

    const existing = cart.products.find(
      p => p.productId.toString() === req.params.productId
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.products.push({ productId: req.params.productId, quantity: 1 });
    }
    await cart.save();
    res.json({ message: "Item added to cart!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /cart/update/:userId/:productId
router.post('/update/:userId/:productId', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (cart) {
      const item = cart.products.find(
        p => p.productId.toString() === req.params.productId
      );
      if (item) item.quantity = req.body.quantity;
      await cart.save();
    }
    res.json({ message: "Cart updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /cart/remove/:userId/:productId
router.post('/remove/:userId/:productId', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (cart) {
      cart.products = cart.products.filter(
        p => p.productId.toString() !== req.params.productId
      );
      await cart.save();
    }
    res.json({ message: "Item removed from cart!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /cart/clear/:userId
router.post('/clear/:userId', verifyToken, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: "Cart cleared successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;