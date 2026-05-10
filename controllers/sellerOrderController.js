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
            .populate('customer', 'firstName lastName email phone')
            .populate('items.product', 'name images price')
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
            .populate('customer', 'firstName lastName email phone')
            .populate('items.product', 'name images price');

        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.json({ success: true, data: { order } });
    } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const allowed = ['confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const products = await Product.find({ seller: req.user._id }).select('_id');
        const productIds = products.map(p => p._id);

        const order = await Order.findOne({
            _id: req.params.id,
            'items.product': { $in: productIds }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not yours.' });
        }
        if (order.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot update cancelled order.' });
        }

        // Only restore stock if cancelling a confirmed/pending order
        // Note: stock is already deducted at order creation, so no need to deduct again on 'confirmed'
        if (status === 'cancelled' && ['pending', 'confirmed'].includes(order.status)) {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            }
        }

        order.status = status;
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('customer', 'firstName lastName email phone')
            .populate('items.product', 'name images price');

        res.json({ success: true, data: { order: populatedOrder }, message: 'Order status updated.' });
    } catch (err) { next(err); }
};

module.exports = { getSellerOrders, getSellerOrder, updateOrderStatus };