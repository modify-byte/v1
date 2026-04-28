const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity:  { type: Number, default: 1 },
    price:     Number
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["online", "cod"],
    default: "online"
  },
  status: {
    type: String,
    default: "placed",
    enum: ["placed", "paid", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]
  },
  cancelReason: { type: String, default: "" },
  address:   { type: String, required: true },
  paymentId: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);