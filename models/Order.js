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
    shippingCost: { type: Number, default: 80 },
    totalPrice: { type: Number, required: true },
    commissionRate: { type: Number, default: 0.10 },
    commissionAmount: { type: Number },
    sellerEarnings: { type: Number },
    shippingAddress: {
        firstName: { type: String },
        lastName: { type: String },
        street: { type: String },
        city: { type: String },
        governorate: { type: String },
        phone: { type: String },
        email: { type: String },
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'fawry', 'instapay'],
        default: 'cod'
    },
}, { timestamps: true });

orderSchema.pre('save', function (next) {
    if (this.isNew) {
        this.commissionAmount = +(this.subtotal * this.commissionRate).toFixed(2);
        this.sellerEarnings = +(this.subtotal - this.commissionAmount).toFixed(2);
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);