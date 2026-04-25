const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    label: { type: String, default: 'Home' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: 'Egypt' },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
