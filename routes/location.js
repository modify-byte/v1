const express = require('express');
const router = express.Router();
const LiveLocation = require('../models/LiveLocation');
const { verifySelfOrAdmin } = require('../middleware/auth');

const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;

// POST /location/live/update/:userId
router.post('/live/update/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const accuracy = Number(req.body.accuracy || 0);
    const address = String(req.body.address || '').trim();

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    const updated = await LiveLocation.findOneAndUpdate(
      { userId: req.params.userId },
      {
        latitude,
        longitude,
        accuracy,
        address,
        isLive: true,
        lastSeenAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Live location updated successfully.", location: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /location/current/:userId
router.post('/current/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const location = await LiveLocation.findOne({ userId: req.params.userId });
    if (!location) return res.status(404).json({ message: "Current location not found." });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /location/live/:userId
router.post('/live/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const location = await LiveLocation.findOne({ userId: req.params.userId });
    if (!location) return res.status(404).json({ message: "Live location not found." });

    const liveWindowMs = 2 * 60 * 1000;
    const isCurrentlyLive = Date.now() - new Date(location.lastSeenAt).getTime() <= liveWindowMs;

    res.json({
      ...location.toObject(),
      isCurrentlyLive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /location/live/stop/:userId
router.post('/live/stop/:userId', verifySelfOrAdmin, async (req, res) => {
  try {
    const updated = await LiveLocation.findOneAndUpdate(
      { userId: req.params.userId },
      { isLive: false, lastSeenAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Live location not found." });
    res.json({ message: "Live location stopped successfully.", location: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
