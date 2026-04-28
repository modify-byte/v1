const mongoose = require('mongoose');

const staticPageSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['about', 'terms', 'privacy']
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('StaticPage', staticPageSchema);
