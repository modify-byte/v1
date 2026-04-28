const express = require('express');
const router = express.Router();
const StaticPage = require('../models/StaticPage');
const { verifyAdmin } = require('../middleware/auth');

const CONTENT_KEYS = ['about', 'terms', 'privacy'];

async function ensureDefaults() {
  const defaults = [
    { key: 'about', title: 'About Us', content: 'Write about your company here.' },
    { key: 'terms', title: 'Terms & Conditions', content: 'Write your terms and conditions here.' },
    { key: 'privacy', title: 'Privacy Policy', content: 'Write your privacy policy here.' }
  ];

  for (const page of defaults) {
    await StaticPage.findOneAndUpdate(
      { key: page.key },
      { $setOnInsert: page },
      { upsert: true, new: true }
    );
  }
}

// POST /content/get/:key
router.post('/get/:key', async (req, res) => {
  try {
    await ensureDefaults();
    const key = String(req.params.key || '').trim().toLowerCase();
    if (!CONTENT_KEYS.includes(key)) {
      return res.status(400).json({ message: "Invalid content key. Use about/terms/privacy." });
    }
    const page = await StaticPage.findOne({ key });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /content/all
router.post('/all', async (req, res) => {
  try {
    await ensureDefaults();
    const pages = await StaticPage.find().sort({ key: 1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Shortcut endpoints
router.post('/about', async (req, res) => {
  try {
    await ensureDefaults();
    const page = await StaticPage.findOne({ key: 'about' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/terms', async (req, res) => {
  try {
    await ensureDefaults();
    const page = await StaticPage.findOne({ key: 'terms' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/privacy', async (req, res) => {
  try {
    await ensureDefaults();
    const page = await StaticPage.findOne({ key: 'privacy' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /content/update/:key - admin only
router.post('/update/:key', verifyAdmin, async (req, res) => {
  try {
    const key = String(req.params.key || '').trim().toLowerCase();
    if (!CONTENT_KEYS.includes(key)) {
      return res.status(400).json({ message: "Invalid content key. Use about/terms/privacy." });
    }
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required." });
    }

    const page = await StaticPage.findOneAndUpdate(
      { key },
      { title: String(title).trim(), content: String(content).trim(), updatedBy: req.user.id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ message: `${key} page updated successfully.`, page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
