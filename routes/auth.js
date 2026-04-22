const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../config/email');
const { verifyToken } = require('../middleware/auth');

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email is already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      message: "Login successful!",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/logout
router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: "Logged out successfully. Please remove the token from your app." });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Email not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOTP = otp;
    user.resetOTPExpiry = expiry;
    await user.save();

    await sendEmail(
      email,
      "Password Reset OTP",
      `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #eee;border-radius:12px;padding:32px;">
        <h2 style="color:#e74c3c;margin-bottom:8px;">Password Reset</h2>
        <p style="color:#555;">Your OTP code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2c3e50;padding:16px 0;">${otp}</div>
        <p style="color:#888;font-size:13px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:13px;">If you did not request this, please ignore this email.</p>
      </div>
      `
    );

    res.json({ message: "OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send email: " + err.message });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found." });
    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Invalid OTP." });
    if (user.resetOTPExpiry < new Date())
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    res.json({ message: "OTP verified. You can now reset your password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found." });
    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Invalid OTP." });
    if (user.resetOTPExpiry < new Date())
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = "";
    user.resetOTPExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;