const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifySelfOrAdmin } = require('../middleware/auth');

// POST /user/profile/:userId
router.post('/profile/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -resetOTP -resetOTPExpiry');
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /user/profile/update/:userId
router.post('/profile/update/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const { password, role, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select('-password -resetOTP -resetOTPExpiry');
    res.json({ message: "Profile updated successfully!", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /user/change-password/:userId
router.post('/change-password/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /user/delete/:userId
router.post('/delete/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: "Account deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;