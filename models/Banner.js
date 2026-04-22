const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image:    { type: String, required: true },
  title:    { type: String, default: "" },
  link:     { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);