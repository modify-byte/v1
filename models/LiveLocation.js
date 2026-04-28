const mongoose = require('mongoose');

const liveLocationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number, default: 0 },
  address: { type: String, default: '' },
  isLive: { type: Boolean, default: true },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LiveLocation', liveLocationSchema);
