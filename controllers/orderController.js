const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const nodemailer = require('nodemailer');

const sendOrderEmail = async (order, customerEmail, customerName) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'style.hub7031@gmail.com', pass: 'hrwn ckix ebob yuix' },
  });

  const orderNum = `SH-${order._id.toString().slice(-8).toUpperCase()}`;
  const paymentLabels = { cod: 'Cash on Delivery', card: 'Credit/Debit Card', fawry: 'Fawry', instapay: 'InstaPay' };

  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece6;">
        <strong>${item.name}</strong><br/>
        <span style="color:#8c8880;font-size:12px;">Size: ${item.size || '—'} · Qty: ${item.quantity}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ece6;text-align:right;font-weight:600;">
        LE ${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>`).join('');

  await transporter.sendMail({
    from: '"StyleHub" <style.hub7031@gmail.com>',
    to: customerEmail,
    subject: `✅ Order Confirmed — ${orderNum} | StyleHub`,
    html: `
    <body style="margin:0;padding:0;background:#f8f6f2;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr><td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e4e0da;">

            <tr><td style="background:#1a1a18;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:300;letter-spacing:4px;">STYLEHUB</h1>
              <p style="margin:6px 0 0;color:#92A079;font-size:11px;letter-spacing:2px;">ORDER CONFIRMATION</p>
            </td></tr>

            <tr><td style="padding:32px 40px 20px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:400;">Thank you, ${customerName}! 🎉</h2>
              <p style="margin:0;color:#8c8880;font-size:14px;line-height:1.7;">Your order has been placed. We'll notify you when it ships.</p>
            </td></tr>

            <tr><td style="padding:0 40px 24px;">
              <table width="100%" style="background:#f8f6f2;border:1px solid #e4e0da;border-radius:4px;"><tr><td style="padding:20px 24px;">
                <table width="100%"><tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;color:#8c8880;text-transform:uppercase;">Order Number</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a18;">${orderNum}</p>
                  </td>
                  <td style="text-align:right;">
                    <p style="margin:0 0 4px;font-size:11px;color:#8c8880;text-transform:uppercase;">Estimated Delivery</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#92A079;">3–5 business days</p>
                  </td>
                </tr><tr><td colspan="2" style="padding-top:14px;border-top:1px solid #e4e0da;">
                  <p style="margin:8px 0 4px;font-size:11px;color:#8c8880;text-transform:uppercase;">Payment</p>
                  <p style="margin:0;font-size:14px;color:#1a1a18;">${paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
                </td></tr></table>
              </td></tr></table>
            </td></tr>

            <tr><td style="padding:0 40px 24px;">
              <h3 style="margin:0 0 14px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Items Ordered</h3>
              <table width="100%">${itemsHTML}</table>
            </td></tr>

            <tr><td style="padding:0 40px 32px;">
              <table width="100%" style="border-top:2px solid #1a1a18;">
                <tr><td style="padding:12px 0 4px;color:#8c8880;font-size:13px;">Subtotal</td><td style="text-align:right;font-size:13px;">LE ${order.subtotal?.toLocaleString()}</td></tr>
                <tr><td style="padding:4px 0;color:#8c8880;font-size:13px;">Shipping</td><td style="text-align:right;font-size:13px;">LE ${order.shippingCost?.toLocaleString()}</td></tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:16px;font-weight:700;border-top:1px solid #e4e0da;">Total</td>
                  <td style="padding:12px 0 0;text-align:right;font-size:16px;font-weight:700;border-top:1px solid #e4e0da;">LE ${order.totalPrice?.toLocaleString()}</td>
                </tr>
              </table>
            </td></tr>

            <tr><td style="padding:0 40px 32px;">
              <h3 style="margin:0 0 10px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Shipping To</h3>
              <p style="margin:0;color:#555;font-size:13px;line-height:1.8;">
                ${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}<br/>
                ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.governorate}<br/>
                ${order.shippingAddress?.phone}
              </p>
            </td></tr>

            <tr><td style="background:#f8f6f2;padding:20px 40px;text-align:center;border-top:1px solid #e4e0da;">
              <p style="margin:0;font-size:11px;color:#b0ada8;">© ${new Date().getFullYear()} StyleHub. All rights reserved.</p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>`,
  });
};

const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cod' } = req.body;

    const validPayments = ['cod', 'card', 'fawry', 'instapay'];
    if (!validPayments.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method.' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
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
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });
    }

    const shippingCost = 80;

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      subtotal: totalPrice,
      shippingCost,
      totalPrice: totalPrice + shippingCost,
      shippingAddress,
      paymentMethod,
    });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ customer: req.user._id }, { items: [] });

    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name images price salePrice');

    // Send confirmation email
    try {
      const customerEmail = order.shippingAddress?.email || req.user.email;
      const customerName = order.shippingAddress?.firstName || req.user.firstName || 'Customer';
      await sendOrderEmail(populatedOrder, customerEmail, customerName);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.status(201).json({ success: true, data: { order: populatedOrder } });
  } catch (err) {
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'name images price salePrice')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
      .populate('items.product', 'name images price salePrice');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order.' });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ success: true, message: 'Order cancelled and stock restored.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder };