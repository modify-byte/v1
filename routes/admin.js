const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { verifyAdmin } = require('../middleware/auth');

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
    const order = await Order.findByIdAndUpdate(
      req.params.orderId, { status: "shipped" }, { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    await Notification.create({
      userId: order.userId,
      title: "Order Shipped!",
      message: `Your order has been shipped. Order ID: ${order._id}`
    });

    res.json({ message: "Order shipped successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/orders/deliver/:orderId
router.post('/orders/deliver/:orderId', verifyAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId, { status: "delivered" }, { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    await Notification.create({
      userId: order.userId,
      title: "Order Delivered!",
      message: `Your order has been delivered. Order ID: ${order._id}. Thank you for shopping!`
    });

    res.json({ message: "Order delivered successfully!", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /admin/orders/status/:orderId
router.post('/orders/status/:orderId', verifyAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    await Notification.create({
      userId: order.userId,
      title: "Order Status Updated",
      message: `Your order status has been updated to: ${req.body.status}. Order ID: ${order._id}`
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

module.exports = router;