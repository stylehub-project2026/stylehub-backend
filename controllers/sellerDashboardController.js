const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

const getDashboard = async (req, res, next) => {
    try {
        const sellerId = req.user._id;

        const products = await Product.find({ seller: sellerId, isActive: true });
        const productIds = products.map(p => p._id);

        const orders = await Order.find({ 'items.product': { $in: productIds } });

        let totalRevenue = 0;
        let totalSold = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (productIds.map(id => id.toString()).includes(item.product?.toString())) {
                    if (order.status !== 'cancelled') {
                        totalRevenue += item.price * item.quantity;
                        totalSold += item.quantity;
                    }
                }
            });
        });

        let avgRating = 0;
        let totalReviews = 0;
        products.forEach(p => {
            avgRating += p.avgRating * p.reviewCount;
            totalReviews += p.reviewCount;
        });
        avgRating = totalReviews > 0 ? (avgRating / totalReviews).toFixed(1) : '0.0';

        const ordersByStatus = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
        orders.forEach(o => {
            if (ordersByStatus[o.status] !== undefined) ordersByStatus[o.status]++;
        });

        res.json({
            success: true,
            data: {
                totalProducts: products.length,
                activeProducts: products.filter(p => p.isActive).length,
                totalOrders: orders.length,
                totalRevenue,
                totalSold,
                avgRating,
                totalReviews,
                ordersByStatus,
            },
        });
    } catch (err) {
        next(err);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const sellerId = req.user._id;
        const products = await Product.find({ seller: sellerId }).select('_id name price stock');
        const productIds = products.map(p => p._id);

        // supply vs order rate by day (last 7 days)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const recentOrders = await Order.find({
            'items.product': { $in: productIds },
            createdAt: { $gte: weekAgo },
            status: { $ne: 'cancelled' },
        });

        const orderRateByDay = Array(7).fill(0);
        recentOrders.forEach(order => {
            const dayIndex = new Date(order.createdAt).getDay();
            const mondayBasedIndex = (dayIndex + 6) % 7;
            orderRateByDay[mondayBasedIndex]++;
        });

        const supplyByDay = Array(7).fill(products.reduce((sum, p) => sum + p.stock, 0));

        // price vs order rate
        const priceOrderRate = products.map(p => ({
            price: p.price,
            name: p.name,
            stock: p.stock,
        }));

        res.json({
            success: true,
            data: {
                weeklyChart: days.map((day, i) => ({
                    day,
                    supply: supplyByDay[i],
                    orderRate: orderRateByDay[i],
                })),
                priceOrderRate,
            },
        });
    } catch (err) {
        next(err);
    }
};

const updateStock = async (req, res, next) => {
    try {
        const { stock } = req.body;

        const product = await Product.findOne({ _id: req.params.productId, seller: req.user._id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        product.stock = stock;
        await product.save();

        res.json({ success: true, data: { product } });
    } catch (err) {
        next(err);
    }
};

module.exports = { getDashboard, getAnalytics, updateStock }; 