const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
    color: { type: String },
});

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 70 },
    totalPrice: { type: Number, required: true },
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, default: 'cod' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
