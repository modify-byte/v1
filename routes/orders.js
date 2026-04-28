const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notification');

// POST /orders/place
router.post('/place', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.body.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only place orders for your own account." });
    }

    const paymentMethod = String(req.body.paymentMethod || 'online').toLowerCase();
    if (!['online', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method. Use 'online' or 'cod'." });
    }

    const orderPayload = { ...req.body, paymentMethod };
    if (paymentMethod === 'cod') {
      orderPayload.status = 'placed';
      orderPayload.paymentId = '';
    }

    const order = new Order(orderPayload);
    await order.save();

    // Clear cart after placing order
    await Cart.findOneAndDelete({ userId: req.body.userId });

    // Auto notification
    await createNotification({
      userId: req.body.userId,
      type: 'order_update',
      title: "Order Placed Successfully!",
      message: `Your order has been placed (${paymentMethod.toUpperCase()}). Order ID: ${order._id}. Total: ₹${order.totalAmount}`,
      sourceId: String(order._id),
      dedupeScope: `order-placed-${order._id}`
    });

    res.status(201).json({ message: "Order placed successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders/get/:userId
router.post('/get/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only access your own orders." });
    }

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
    const filter = { _id: req.params.orderId };
    if (req.user.role !== 'admin') filter.userId = req.user.id;

    const order = await Order.findOne(filter)
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
    const filter = { _id: req.params.orderId };
    if (req.user.role !== 'admin') filter.userId = req.user.id;
    const order = await Order.findOne(filter);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        message: `Order is already ${order.status}. Status cannot be changed now.`
      });
    }

    const cancelReason = String(req.body.reason || '').trim();
    order.status = "cancelled";
    order.cancelReason = cancelReason;
    await order.save();

    await createNotification({
      userId: order.userId,
      type: 'order_update',
      title: "Order Cancelled",
      message: `Your order has been cancelled. Order ID: ${order._id}. Please place a new order if needed.`,
      sourceId: String(order._id),
      dedupeScope: `order-cancelled-${order._id}`
    });

    res.json({ message: "Order cancelled successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders/track/:orderId
router.post('/track/:orderId', verifyToken, async (req, res) => {
  try {
    const filter = { _id: req.params.orderId };
    if (req.user.role !== 'admin') filter.userId = req.user.id;
    const order = await Order.findOne(filter);
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