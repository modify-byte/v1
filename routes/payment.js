const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// POST /payment/create-order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, userId } = req.body;
    res.json({
      message: "Payment order created!",
      orderId: "pay_" + Date.now(),
      amount,
      currency: "INR",
      userId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /payment/verify
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentId, status: "paid" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    await Notification.create({
      userId: order.userId,
      title: "Payment Successful!",
      message: `Payment confirmed. Payment ID: ${paymentId}`
    });

    res.json({ message: "Payment verified successfully!", paymentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /payment/history/:userId
router.post('/history/:userId', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.params.userId,
      paymentId: { $ne: "" }
    }).populate('products.productId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;