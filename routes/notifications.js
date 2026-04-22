const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// POST /notifications/get/:userId
router.post('/get/:userId', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notifications/read/:notificationId
router.post('/read/:notificationId', verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
    res.json({ message: "Notification marked as read!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notifications/delete/:notificationId
router.post('/delete/:notificationId', verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: "Notification deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;