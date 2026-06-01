const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('../utils/slugify');

const sellerSchema = new mongoose.Schema({
    brandName: { type: String, required: true, trim: true },
    brandSlug: { type: String, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    description: { type: String },
    category: { type: String, enum: ['women', 'men', 'kids', 'all'], default: 'all' },
    logo: { type: String },
    isApproved: { type: Boolean, default: false },
    subscriptionStatus: {
        type: String,
        enum: ['none', 'pending', 'active', 'rejected'],
        default: 'none'
    },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    subscriptionPlan: { type: String, enum: ['basic', 'standard', 'premium'], default: 'standard' },
    subscriptionPaidAmount: { type: Number, default: 0 },
    subscriptionPaidAt: { type: Date },
    discountEndsAt: { type: Date },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
}, { timestamps: true });

// 🔥 Auto-generate unique brandSlug whenever brandName changes
sellerSchema.pre('save', async function (next) {
    if (!this.isModified('brandName') && this.brandSlug) return next();

    let baseSlug = slugify(this.brandName);

    // Fallback لو الاسم كله رموز/عربي ومطلعش حاجة
    if (!baseSlug) {
        baseSlug = 'seller' + Date.now().toString().slice(-6);
    }

    // Collision handling: لو الـ slug موجود بالفعل، ضيف رقم
    let slug = baseSlug;
    let counter = 1;
    const SellerModel = this.constructor;

    while (await SellerModel.findOne({ brandSlug: slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}${counter}`;
        counter++;
    }

    this.brandSlug = slug;
    next();
});

// Password hashing (زي ما كان)
sellerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

sellerSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

sellerSchema.methods.isDiscountActive = function () {
    return this.discountEndsAt && new Date() < this.discountEndsAt;
};

module.exports = mongoose.model('Seller', sellerSchema);