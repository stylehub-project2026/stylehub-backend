const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const getSellerOrders = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const products = await Product.find({ seller: req.user._id }).select('_id');
        const productIds = products.map(p => p._id);

        const filter = { 'items.product': { $in: productIds } };
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const orders = await Order.find(filter)
            .populate('customer', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(filter);
        res.json({ success: true, data: { orders, total, page: Number(page) } });
    } catch (err) { next(err); }
};

const getSellerOrder = async (req, res, next) => {
    try {
        const products = await Product.find({ seller: req.user._id }).select('_id');
        const productIds = products.map(p => p._id);

        const order = await Order.findOne({ _id: req.params.id, 'items.product': { $in: productIds } })
            .populate('customer', 'name email phone');

        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.json({ success: true, data: { order } });
    } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        const { status } = req.body;
        const allowed = ['confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!allowed.includes(status)) {
            await session.endSession();
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const products = await Product.find({ seller: req.user._id }).select('_id');
        const productIds = products.map(p => p._id);
        let order = await Order.findOne({
            _id: req.params.id,
            'items.product': { $in: productIds }
        }).session(session);
        if (!order) {
            await session.endSession();
            return res.status(404).json({ success: false, message: 'Order not found or not yours.' });
        }

        if (order.status === 'cancelled') {
            await session.endSession();
            return res.status(400).json({ success: false, message: 'Cannot update cancelled order.' });
        }

        let message = 'Order status updated.';
        await session.withTransaction(async () => {
            if (status === 'confirmed') {
                // Deduct stock
                for (const item of order.items) {
                    if (productIds.includes(item.product)) {
                        const product = await Product.findById(item.product).session(session);
                        if (product && product.stock >= item.quantity) {
                            product.stock -= item.quantity;
                            await product.save({ session });
                        }
                    }
                }
            } else if (status === 'cancelled' && ['pending', 'confirmed'].includes(order.status)) {
                // Restore stock
                for (const item of order.items) {
                    if (productIds.includes(item.product)) {
                        const product = await Product.findById(item.product).session(session);
                        if (product) {
                            product.stock += item.quantity;
                            await product.save({ session });
                        }
                    }
                }
                message = 'Order cancelled and stock restored.';
            }
            // Update status
            order.status = status;
            await order.save({ session });
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('customer', 'name email phone')
            .populate('items.product', 'name');
        res.json({ success: true, data: { order: populatedOrder }, message });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        await session.endSession();
    }
};

module.exports = { getSellerOrders, getSellerOrder, updateOrderStatus };