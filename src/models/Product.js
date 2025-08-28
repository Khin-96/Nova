const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  tags: {
    type: [String],
    enum: ['new', 'out-of-stock', 'coming-soon', 'sale'],
    default: []
  },
  sizes: {
    type: [String],
    enum: ['S', 'M', 'L', 'XL'],
    default: ['S', 'M', 'L', 'XL']
  }
}, {
  timestamps: true
});

productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);