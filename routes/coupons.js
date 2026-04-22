const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { verifyAdmin } = require('../middleware/auth');

// POST /coupons/apply
router.post('/apply', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon)
      return res.status(404).json({ message: "Invalid or expired coupon code." });
    if (orderAmount < coupon.minOrder)
      return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrder}` });

    const discountAmount = (orderAmount * coupon.discount) / 100;
    const finalAmount = orderAmount - discountAmount;
    res.json({ message: "Coupon applied successfully!", discount: coupon.discount, discountAmount, finalAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /coupons/add  — Admin only
router.post('/add', verifyAdmin, async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ message: "Coupon added successfully!", coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /coupons/delete/:couponId  — Admin only
router.post('/delete/:couponId', verifyAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.couponId);
    res.json({ message: "Coupon deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;