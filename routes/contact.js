const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { verifyAdmin, verifyToken } = require('../middleware/auth');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /contact/submit
router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !subject || !message) {
      return res.status(400).json({ message: "name, email, subject and message are required." });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const saved = await ContactMessage.create({
      name: String(name).trim(),
      email: normalizedEmail,
      subject: String(subject).trim(),
      message: String(message).trim(),
      userId: req.body.userId || null
    });
    res.status(201).json({ message: "Contact message submitted successfully.", contact: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /contact/my/:userId - logged in user can see own submissions
router.post('/my/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "You can only access your own contact messages." });
    }
    const contacts = await ContactMessage.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /contact/all - admin list
router.post('/all', verifyAdmin, async (req, res) => {
  try {
    const contacts = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /contact/status/:contactId - admin status update
router.post('/status/:contactId', verifyAdmin, async (req, res) => {
  try {
    const nextStatus = String(req.body.status || '').trim();
    if (!['open', 'in_progress', 'resolved'].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status. Use open/in_progress/resolved." });
    }
    const updated = await ContactMessage.findByIdAndUpdate(
      req.params.contactId,
      { status: nextStatus },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Contact message not found." });
    res.json({ message: "Contact status updated.", contact: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
