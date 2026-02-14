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

const { queryStkStatus } = require('../services/mpesaService');

// @route   GET /api/orders/:orderId
// @desc    Get order by orderId
// @access  Public
router.get('/:orderId', async (req, res) => {
    const { orderId } = req.params;
    console.log(`GET Order Request: ${orderId}`);
    try {
        // Use findOne with the specific orderId field to avoid _id casting
        let order = await Order.findOne({ orderId: String(orderId) });
        if (!order) {
            console.warn(`Order ${orderId} not found.`);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Proactive Status Query: If order is still pending and has a checkoutRequestId, check M-Pesa
        if (order.status === 'pending' && order.checkoutRequestId) {
            try {
                console.log(`Proactively querying status for Order: ${orderId}...`);
                const data = await queryStkStatus(order.checkoutRequestId);

                if (data && data.ResponseCode === "0") {
                    const { ResultCode, ResultDesc } = data;
                    order.paymentResult = ResultDesc;
                    if (ResultCode === "0") {
                        order.status = 'processing';
                        console.log(`Order ${orderId} updated to 'processing' during GET request.`);
                    } else {
                        order.status = 'cancelled';
                        console.log(`Order ${orderId} updated to 'cancelled' (ResultCode: ${ResultCode}) during GET request.`);
                    }
                    await order.save();
                }
            } catch (error) {
                console.warn(`Proactive query failed for ${orderId}:`, error.message);
                // Continue to return the order even if query fails
            }
        }

        res.json(order);
    } catch (err) {
        console.error(`Error fetching order ${orderId}:`, err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
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
        console.error("Error in PATCH /orders/:id/deliver:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.json(order);
    } catch (err) {
        console.error("Error updating status:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/orders/:id/deliver
// @desc    Mark order as delivered
// @access  Private (Admin)
router.patch('/:id/deliver', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: 'delivered' },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.json(order);
    } catch (err) {
        console.error("Error in PATCH /orders/:id/deliver:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
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
        console.error("Error in PATCH /orders/:id/deliver:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

module.exports = router;
