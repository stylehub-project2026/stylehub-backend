const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Address = require('../models/Address');

const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cod' } = req.body;

    const validPayments = ['cod', 'card'];
    if (!validPayments.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid shipping address' });
    }
    const address = await Address.findOne({ _id: shippingAddress, customer: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Shipping address not found' });
    }

    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}` });
      }

      const price = product.salePrice || product.price;
      totalPrice += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });
    }

    const shippingCost = 70;

    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        for (const item of items) {
          const product = await Product.findById(item.productId).session(session);
          if (!product || !product.isActive || product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product ? product.name : 'unknown product'}`);
          }
        }
        order = await Order.create([{
          customer: req.user._id,
          items: orderItems,
          subtotal: totalPrice,
          shippingCost,
          totalPrice: totalPrice + shippingCost,
          shippingAddress,
          paymentMethod,
        }], { session });
      });
    } catch (err) {
      await session.abortTransaction();
      return next(err);
    } finally {
      await session.endSession();
    }

    // Clear cart
    await Cart.findOneAndUpdate({ customer: req.user._id }, { items: [] }, { session: false });

    const populatedOrder = await Order.findById(order[0]._id)
      .populate('items.product', 'name images price salePrice')
      .populate('shippingAddress', 'street city country');

    res.status(201).json({ success: true, data: { order: populatedOrder } });
  } catch (err) {
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'name images price salePrice')
      .populate('shippingAddress', 'street city')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
      .populate('items.product', 'name images price salePrice')
      .populate('shippingAddress', 'street city');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).session(session);
    if (!order) {
      await session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      await session.endSession();
      return res.status(400).json({ success: false, message: 'Cannot cancel this order.' });
    }

    await session.withTransaction(async () => {
      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }

      order.status = 'cancelled';
      await order.save({ session });
    });

    res.json({ success: true, message: 'Order cancelled and stock restored.' });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    await session.endSession();
  }
};

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder };