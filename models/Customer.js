const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

customerSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);