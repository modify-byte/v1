const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { verifyAdmin } = require('../middleware/auth');
const { createNotification } = require('../utils/notification');
const ORDER_STATUSES = ["placed", "paid", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const LOCKED_STATUSES = ["delivered", "cancelled"];

function isLockedOrder(order) {
  return LOCKED_STATUSES.includes(order.status);
}

// POST /admin/orders/all
router.post('/orders/all', verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('products.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/orders/ship/:orderId
router.post('/orders/ship/:orderId', verifyAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (isLockedOrder(order)) {
      return res.status(400).json({
        message: `Order is already ${order.status}. Status cannot be changed now.`
      });
    }

    order.status = "shipped";
    await order.save();

    await createNotification({
      userId: order.userId,
      type: 'order_update',
      title: "Order Shipped!",
      message: `Your order has been shipped. Order ID: ${order._id}`,
      sourceId: String(order._id),
      dedupeScope: `order-shipped-${order._id}`
    });

    res.json({ message: "Order shipped successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/orders/deliver/:orderId
router.post('/orders/deliver/:orderId', verifyAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (isLockedOrder(order)) {
      return res.status(400).json({
        message: `Order is already ${order.status}. Status cannot be changed now.`
      });
    }

    order.status = "delivered";
    await order.save();

    await createNotification({
      userId: order.userId,
      type: 'order_update',
      title: "Order Delivered!",
      message: `Your order has been delivered. Order ID: ${order._id}. Thank you for shopping!`,
      sourceId: String(order._id),
      dedupeScope: `order-delivered-${order._id}`
    });

    res.json({ message: "Order delivered successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/orders/status/:orderId
router.post('/orders/status/:orderId', verifyAdmin, async (req, res) => {
  try {
    const nextStatus = String(req.body.status || '').trim();
    const cancelReason = String(req.body.reason || '').trim();
    if (!ORDER_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid order status provided." });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (isLockedOrder(order)) {
      return res.status(400).json({
        message: `Order is already ${order.status}. Status cannot be changed now.`
      });
    }
    if (order.status === nextStatus) {
      return res.status(400).json({ message: `Order is already ${nextStatus}.` });
    }
    if (nextStatus === 'cancelled' && !cancelReason) {
      return res.status(400).json({ message: "Cancel reason is required when cancelling an order." });
    }

    order.status = nextStatus;
    if (nextStatus === 'cancelled') {
      order.cancelReason = cancelReason;
    }
    await order.save();

    const notificationMessage = nextStatus === 'cancelled'
      ? `Your order has been cancelled by admin. Reason: ${cancelReason}. Order ID: ${order._id}. Please place a new order if needed.`
      : `Your order status has been updated to: ${nextStatus}. Order ID: ${order._id}`;

    await createNotification({
      userId: order.userId,
      type: 'order_update',
      title: "Order Status Updated",
      message: notificationMessage,
      sourceId: String(order._id),
      dedupeScope: `order-status-${order._id}-${nextStatus}`
    });

    res.json({ message: "Order status updated!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/users/all
router.post('/users/all', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetOTP -resetOTPExpiry')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/dashboard
router.post('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const totalUsers      = await User.countDocuments();
    const totalProducts   = await Product.countDocuments();
    const totalOrders     = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });
    const cancelledOrders = await Order.countDocuments({ status: "cancelled" });
    const pendingOrders   = await Order.countDocuments({ status: "placed" });
    const allOrders       = await Order.find();
    const totalRevenue    = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      pendingOrders,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/offers/broadcast
router.post('/offers/broadcast', verifyAdmin, async (req, res) => {
  try {
    const { title, message, offerId, offerEndAt, sendNotification = false } = req.body;

    if (!sendNotification) {
      return res.json({ message: "Offer saved without notifications.", sent: 0 });
    }

    if (!title || !message || !offerId || !offerEndAt) {
      return res.status(400).json({
        message: "title, message, offerId and offerEndAt are required when sendNotification is true."
      });
    }

    const parsedEnd = new Date(offerEndAt);
    if (Number.isNaN(parsedEnd.getTime()) || parsedEnd <= new Date()) {
      return res.status(400).json({ message: "offerEndAt must be a valid future date." });
    }

    const users = await User.find({}, '_id');
    let sent = 0;

    for (const user of users) {
      const created = await createNotification({
        userId: user._id,
        type: 'offer',
        title,
        message,
        sourceId: String(offerId),
        offerId: String(offerId),
        offerEndAt: parsedEnd,
        dedupeScope: `offer-${offerId}`
      });
      if (created) sent += 1;
    }

    res.json({
      message: "Offer notifications processed successfully.",
      usersTargeted: users.length,
      sent
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;