const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['order_update', 'payment', 'offer', 'system'],
    default: 'system'
  },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  isRead: { type: Boolean, default: false },
  sourceId: { type: String, default: "" },
  dedupeKey: { type: String, default: "" },
  offerId: { type: String, default: "" },
  offerEndAt: { type: Date },
  expiresAt: { type: Date }
}, { timestamps: true });

notificationSchema.pre('validate', function (next) {
  if (this.expiresAt) return next();

  if (this.type === 'offer' && this.offerEndAt) {
    this.expiresAt = this.offerEndAt;
    return next();
  }

  // Default lifecycle: notifications expire after 30 days.
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  next();
});

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string", $ne: "" } } }
);

module.exports = mongoose.model('Notification', notificationSchema);









