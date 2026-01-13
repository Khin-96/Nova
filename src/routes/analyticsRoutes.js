const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard stats (Revenue, Recent Orders, Top Products)
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
    try {
        // 1. Total Revenue & Total Orders
        // Assuming Order model has 'total' (Number) and 'status' (String)
        const totalRevenueAgg = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } }, // Exclude cancelled if relevant
            { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalOrders: { $count: {} } } }
        ]);

        const stats = totalRevenueAgg[0] || { totalRevenue: 0, totalOrders: 0 };

        // 2. Orders per Day (Last 7 Days) for Chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const ordersPerDay = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $count: {} },
                    revenue: { $sum: "$total" }
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Top Selling Products
        // This effectively finds the "most bought product"
        // We need to unwind items array in Order
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            { 
                $group: { 
                    _id: "$items.name", 
                    quantitySold: { $sum: "$items.quantity" },
                    revenueGenerated: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                } 
            },
            { $sort: { quantitySold: -1 } },
            { $limit: 5 }
        ]);

        // 4. Least Selling Products (Optional/Tricky if 0 sales, but we can do bottom of sales list)
        // Note: This only shows products that have sold at least once but poorly. 
        // To find 0 sales, we'd need to query Products and exclude those in Orders, which is heavier.
        // For now, let's just return the bottom 5 of items that HAVE sold.
        const bottomProducts = await Order.aggregate([
             { $unwind: "$items" },
             { 
                 $group: { 
                     _id: "$items.name", 
                     quantitySold: { $sum: "$items.quantity" }
                 } 
             },
             { $sort: { quantitySold: 1 } },
             { $limit: 5 }
        ]);

        res.json({
            revenue: stats.totalRevenue,
            totalOrders: stats.totalOrders,
            ordersPerDay,
            topProducts,
            bottomProducts
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
