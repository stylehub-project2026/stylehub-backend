const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
    brandName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    description: { type: String },
    category: { type: String, enum: ['women', 'men', 'kids', 'all'], default: 'all' },
    logo: { type: String },
    isApproved: { type: Boolean, default: true },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
}, { timestamps: true });

sellerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

sellerSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);
