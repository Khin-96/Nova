const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public (allows guest checkout)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { items, deliveryLocation, phone, guestEmail, guestName, notes } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ msg: 'Order must contain at least one item' });
    }
    if (!deliveryLocation || !phone) {
      return res.status(400).json({ msg: 'Delivery location and phone are required' });
    }

    // Calculate totals and validate products
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ msg: `Product ${item.product} not found` });
      }

      // Check inventory
      if (product.inventory < item.quantity) {
        return res.status(400).json({ 
          msg: `Insufficient inventory for ${product.name}. Available: ${product.inventory}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size
      });

      // Update product inventory and purchase count
      product.inventory -= item.quantity;
      product.purchaseCount = (product.purchaseCount || 0) + item.quantity;
      await product.save();
    }

    // Calculate delivery fee (example logic)
    const deliveryFee = deliveryLocation.toLowerCase().includes('mombasa') || 
                        deliveryLocation.toLowerCase().includes('kilifi') ? 0 : 450;
    
    const total = subtotal + deliveryFee;

    // Create order
    const orderData = {
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      deliveryLocation,
      phone,
      notes
    };

    // Add user or guest info
    if (req.user) {
      orderData.user = req.user.id;
      
      // Update user purchase history
      for (const item of orderItems) {
        req.user.purchaseHistory.push({
          product: item.product,
          quantity: item.quantity
        });
      }
      await req.user.save();
    } else {
      // Guest checkout
      if (!guestEmail || !guestName) {
        return res.status(400).json({ msg: 'Guest email and name are required' });
      }
      orderData.guestEmail = guestEmail;
      orderData.guestName = guestName;
    }

    const order = await Order.create(orderData);

    res.status(201).json({
      msg: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ msg: 'Server error creating order' });
  }
});

// @route   GET /api/orders
// @desc    Get orders (user's orders or all for admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show user's orders
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    } else {
      // Admin can filter by status
      if (req.query.status) {
        query.status = req.query.status;
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private (owner or admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name image price');

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.user && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid order ID' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (admin only)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ msg: 'Status is required' });
    }

    const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    await order.updateStatus(status, note || `Status updated to ${status}`);

    res.json({
      msg: 'Order status updated',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status (typically from M-Pesa callback)
// @access  Private (admin only for manual updates)
router.put('/:id/payment', protect, admin, async (req, res) => {
  try {
    const { paymentStatus, mpesaTransactionId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    if (mpesaTransactionId) {
      order.mpesaTransactionId = mpesaTransactionId;
    }

    await order.save();

    res.json({
      msg: 'Payment status updated',
      order
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
