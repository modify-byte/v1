const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  category:    { type: String, required: true },
  stock:       { type: Number, default: 0 },
  image:       { type: String, default: "" },
  description: { type: String, default: "" },
  rating:      { type: Number, default: 0 },
  discount:    { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);