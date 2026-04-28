const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const { verifySelfOrAdmin, verifyToken } = require('../middleware/auth');

// POST /address/get/:userId
router.post('/get/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.params.userId });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /address/add/:userId
router.post('/add/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const address = new Address({ userId: req.params.userId, ...req.body });
    await address.save();
    res.status(201).json({ message: "Address added successfully!", address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /address/update/:addressId
router.post('/update/:addressId', verifyToken, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.addressId, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!address) return res.status(404).json({ message: "Address not found." });
    res.json({ message: "Address updated successfully!", address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /address/delete/:addressId
router.post('/delete/:addressId', verifyToken, async (req, res) => {
  try {
    const deleted = await Address.findOneAndDelete({ _id: req.params.addressId, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Address not found." });
    res.json({ message: "Address deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;