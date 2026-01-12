const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, optionalAuth, isAdmin } = require('../middleware/authMiddleware');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public (guest checkout) or Private (logged-in user)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      deliveryAddress,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      orderNotes
    } = req.body;

    // Validation
    if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({ msg: 'Missing required order information.' });
    }

    if (!deliveryAddress || !deliveryAddress.location) {
      return res.status(400).json({ msg: 'Delivery address is required.' });
    }

    // Validate and update inventory
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ msg: `Product ${item.name} not found.` });
      }

      // Check inventory availability
      if (!product.inventory[item.size] || product.inventory[item.size] < item.quantity) {
        return res.status(400).json({ 
          msg: `Insufficient inventory for ${product.name} in size ${item.size}.`,
          product: product.name,
          size: item.size,
          available: product.inventory[item.size] || 0,
          requested: item.quantity
        });
      }
    }

    // Create order
    const orderData = {
      customerName,
      customerEmail,
      customerPhone,
      items,
      deliveryAddress,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      orderNotes
    };

    // Add user reference if authenticated
    if (req.user) {
      orderData.user = req.user.id;
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    // Update inventory for each item
    for (const item of items) {
      const product = await Product.findById(item.product);
      await product.decreaseInventory(item.size, item.quantity);
    }

    res.status(201).json({
      msg: 'Order created successfully!',
      order: newOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ msg: errors[0] || 'Validation failed.' });
    }
    res.status(500).json({ msg: 'Server error during order creation.' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (Admin) or user's orders
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show user's orders
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    // Filtering options
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    
    if (status) {
      query.orderStatus = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ msg: 'Server error fetching orders.' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private (Own order or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    // Check if user owns the order or is admin
    if (req.user.role !== 'admin' && order.user && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    res.json(order);

  } catch (error) {
    console.error('Error fetching order:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid order ID format.' });
    }
    res.status(500).json({ msg: 'Server error fetching order.' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ msg: 'Status is required.' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    await order.updateStatus(status, note || '');

    res.json({
      msg: 'Order status updated successfully.',
      order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid order ID format.' });
    }
    res.status(500).json({ msg: 'Server error updating order status.' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status (Admin only or M-Pesa callback)
// @access  Private (Admin)
router.put('/:id/payment', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ msg: 'Payment status is required.' });
    }

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ msg: 'Invalid payment status value.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    await order.updatePaymentStatus(paymentStatus, transactionId);

    res.json({
      msg: 'Payment status updated successfully.',
      order
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid order ID format.' });
    }
    res.status(500).json({ msg: 'Server error updating payment status.' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel/Delete order (Admin or own order if pending)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    // Check permissions
    const isOwner = order.user && order.user.toString() === req.user.id;
    const isAdminUser = req.user.role === 'admin';
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.orderStatus) && !isAdminUser) {
      return res.status(400).json({ msg: 'Cannot cancel order in current status.' });
    }

    // Mark as cancelled instead of deleting
    await order.updateStatus('cancelled', 'Cancelled by ' + (isAdminUser ? 'admin' : 'customer'));

    // Restore inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.inventory[item.size] += item.quantity;
        product.salesCount -= item.quantity;
        await product.save();
      }
    }

    res.json({ msg: 'Order cancelled successfully.', order });

  } catch (error) {
    console.error('Error cancelling order:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid order ID format.' });
    }
    res.status(500).json({ msg: 'Server error cancelling order.' });
  }
});

module.exports = router;
