const express = require('express');
const router = express.Router();
const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { createNotification } = require('../utils/notification');

const ALLOWED_REQUEST_TYPES = ['return', 'refund'];
const ALLOWED_STATUS = ['requested', 'approved', 'rejected', 'processed'];

// POST /returns/request
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { orderId, requestType, reason = '', details = '' } = req.body;
    if (!orderId || !requestType || !reason.trim()) {
      return res.status(400).json({ message: "orderId, requestType and reason are required." });
    }
    if (!ALLOWED_REQUEST_TYPES.includes(requestType)) {
      return res.status(400).json({ message: "requestType must be return or refund." });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (req.user.role !== 'admin' && String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only create requests for your own orders." });
    }

    const existingOpenRequest = await ReturnRequest.findOne({
      orderId,
      requestType,
      status: { $in: ['requested', 'approved'] }
    });
    if (existingOpenRequest) {
      return res.status(400).json({ message: "An active request already exists for this order." });
    }

    const request = await ReturnRequest.create({
      orderId,
      userId: order.userId,
      requestType,
      reason: reason.trim(),
      details: String(details).trim()
    });

    await createNotification({
      userId: order.userId,
      type: 'order_update',
      title: `${requestType === 'refund' ? 'Refund' : 'Return'} Request Submitted`,
      message: `Your ${requestType} request has been submitted for Order ID: ${order._id}.`,
      sourceId: String(order._id),
      dedupeScope: `${requestType}-request-${order._id}-${request._id}`
    });

    res.status(201).json({ message: `${requestType} request submitted successfully.`, request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /returns/my/:userId
router.post('/my/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "You can only access your own return/refund requests." });
    }
    const requests = await ReturnRequest.find({ userId: req.params.userId })
      .populate('orderId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /returns/all - admin only
router.post('/all', verifyAdmin, async (req, res) => {
  try {
    const requests = await ReturnRequest.find()
      .populate('userId', 'name email')
      .populate('orderId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /returns/update/:requestId - admin only
router.post('/update/:requestId', verifyAdmin, async (req, res) => {
  try {
    const { status, adminNote = '', refundAmount = 0 } = req.body;
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use requested/approved/rejected/processed." });
    }

    const request = await ReturnRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });

    request.status = status;
    request.adminNote = String(adminNote).trim();
    request.refundAmount = Number(refundAmount) || 0;
    await request.save();

    await createNotification({
      userId: request.userId,
      type: 'order_update',
      title: `${request.requestType === 'refund' ? 'Refund' : 'Return'} Request ${status}`,
      message: `Your ${request.requestType} request is now ${status}.`,
      sourceId: String(request.orderId),
      dedupeScope: `${request.requestType}-${request._id}-${status}`
    });

    res.json({ message: "Return/refund request updated successfully.", request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
