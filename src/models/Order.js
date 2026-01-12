const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { 
    type: String, 
    enum: ['S', 'M', 'L', 'XL'],
    required: true 
  },
  image: { type: String }
});

const orderSchema = new mongoose.Schema({
  // Customer information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest checkout
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  
  // Order items
  items: [orderItemSchema],
  
  // Delivery information
  deliveryAddress: {
    location: { type: String, required: true },
    details: { type: String }
  },
  
  // Pricing
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash-on-delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  mpesaTransactionId: { type: String },
  
  // Order status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Order history
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  
  // Additional information
  orderNotes: { type: String },
  trackingNumber: { type: String },
  
  // Timestamps
  confirmedAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date }
  
}, {
  timestamps: true
});

// Indexes for performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ customerPhone: 1 });

// Generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add initial status to history
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = async function(newStatus, note = '') {
  this.orderStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note
  });
  
  // Update timestamp fields based on status
  if (newStatus === 'confirmed') {
    this.confirmedAt = new Date();
  } else if (newStatus === 'shipped') {
    this.shippedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  await this.save();
};

// Method to update payment status
orderSchema.methods.updatePaymentStatus = async function(newStatus, transactionId = null) {
  this.paymentStatus = newStatus;
  if (transactionId) {
    this.mpesaTransactionId = transactionId;
  }
  
  this.statusHistory.push({
    status: `Payment: ${newStatus}`,
    timestamp: new Date(),
    note: transactionId ? `Transaction ID: ${transactionId}` : ''
  });
  
  await this.save();
};

// Virtual for order number (using _id)
orderSchema.virtual('orderNumber').get(function() {
  return `NW-${this._id.toString().slice(-8).toUpperCase()}`;
});

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', orderSchema);
