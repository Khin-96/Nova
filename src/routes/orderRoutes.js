const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { customerName, phone, location, items, subtotal, deliveryFee, total, mpesaReceiptNumber } = req.body;

        // Generate a simple order ID
        const orderId = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

        const newOrder = new Order({
            orderId,
            customerName,
            phone,
            location,
            items,
            subtotal,
            deliveryFee,
            total,
            mpesaReceiptNumber
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/orders
// @desc    Get all orders (with filtering)
// @access  Private (Admin)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/orders/:id/deliver
// @desc    Mark order as delivered
// @access  Private (Admin)
router.patch('/:id/deliver', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = 'delivered';
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
