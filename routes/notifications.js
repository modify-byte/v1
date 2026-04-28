const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// POST /notifications/get/:userId
router.post('/get/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "You can only access your own notifications." });
    }

    const notifications = await Notification.find({
      userId: req.params.userId,
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notifications/read/:notificationId
router.post('/read/:notificationId', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user.id, expiresAt: { $gt: new Date() } },
      { isRead: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Notification not found." });
    res.json({ message: "Notification marked as read!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notifications/delete/:notificationId
router.post('/delete/:notificationId', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user.id
    });
    if (!deleted) return res.status(404).json({ message: "Notification not found." });

    res.json({ message: "Notification deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notifications/unread-count/:userId
router.post('/unread-count/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only access your own notifications." });
    }

    const unread = await Notification.countDocuments({
      userId: req.params.userId,
      isRead: false,
      expiresAt: { $gt: new Date() }
    });
    res.json({ unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notifications/read-all/:userId
router.post('/read-all/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only access your own notifications." });
    }

    const result = await Notification.updateMany(
      { userId: req.params.userId, expiresAt: { $gt: new Date() } },
      { isRead: true }
    );
    res.json({ message: "All active notifications marked as read.", updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;