const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    category: { type: String, enum: ['women', 'men', 'kids', 'all'], default: 'all' },
    tags: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{ type: String }],
    isActive: { type: Boolean, default: true },
    avgRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
