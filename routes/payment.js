const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notification');

// POST /payment/create-order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, userId, paymentMethod = 'online' } = req.body;
    const normalizedMethod = String(paymentMethod).toLowerCase();
    if (!['online', 'cod'].includes(normalizedMethod)) {
      return res.status(400).json({ message: "Invalid payment method. Use 'online' or 'cod'." });
    }

    // COD does not need payment gateway order creation.
    if (normalizedMethod === 'cod') {
      return res.json({
        message: "COD selected. No online payment order is required.",
        paymentMethod: "cod",
        userId
      });
    }

    res.json({
      message: "Payment order created!",
      orderId: "pay_" + Date.now(),
      amount,
      currency: "INR",
      paymentMethod: "online",
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
      { paymentId, status: "paid", paymentMethod: "online" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    await createNotification({
      userId: order.userId,
      type: 'payment',
      title: "Payment Successful!",
      message: `Payment confirmed. Payment ID: ${paymentId}`,
      sourceId: String(order._id),
      dedupeScope: `payment-success-${order._id}`
    });

    res.json({ message: "Payment verified successfully!", paymentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /payment/history/:userId
router.post('/history/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only access your own payment history." });
    }

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