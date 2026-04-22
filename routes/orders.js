const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// POST /orders/place
router.post('/place', verifyToken, async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    // Clear cart after placing order
    await Cart.findOneAndDelete({ userId: req.body.userId });

    // Auto notification
    await Notification.create({
      userId: req.body.userId,
      title: "Order Placed Successfully!",
      message: `Your order has been placed. Order ID: ${order._id}. Total: ₹${order.totalAmount}`
    });

    res.status(201).json({ message: "Order placed successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders/get/:userId
router.post('/get/:userId', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('products.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders/detail/:orderId
router.post('/detail/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('products.productId');
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders/cancel/:orderId
router.post('/cancel/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: "cancelled" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    await Notification.create({
      userId: order.userId,
      title: "Order Cancelled",
      message: `Your order has been cancelled. Order ID: ${order._id}`
    });

    res.json({ message: "Order cancelled successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders/track/:orderId
router.post('/track/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const statusMessages = {
      placed:           "Order has been placed ✅",
      paid:             "Payment confirmed 💳",
      processing:       "Order is being processed ⚙️",
      packed:           "Order has been packed 📦",
      shipped:          "Order has been shipped 🚚",
      out_for_delivery: "Order is out for delivery 🏃",
      delivered:        "Order delivered successfully 🎉",
      cancelled:        "Order has been cancelled ❌"
    };

    res.json({
      orderId:       order._id,
      status:        order.status,
      statusMessage: statusMessages[order.status],
      totalAmount:   order.totalAmount,
      address:       order.address,
      createdAt:     order.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;