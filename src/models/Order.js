const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String }
    }],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'received', 'prepared', 'dispatched', 'enroute', 'delivered', 'cancelled'] },
    mpesaReceiptNumber: { type: String },
    paymentResult: { type: String },
    checkoutRequestId: { type: String },
    merchantRequestId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
