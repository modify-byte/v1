const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestType: { type: String, enum: ['return', 'refund'], required: true },
  reason: { type: String, required: true, trim: true },
  details: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'processed'],
    default: 'requested'
  },
  adminNote: { type: String, default: '', trim: true },
  refundAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
