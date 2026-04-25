const Address = require('../models/Address');

const getAddresses = async (req, res, next) => {
    try {
        const addresses = await Address.find({ customer: req.user._id }).sort({ isDefault: -1 });
        res.json({ success: true, data: { addresses } });
    } catch (err) { next(err); }
};

const addAddress = async (req, res, next) => {
    try {
        const { label, street, city, country, isDefault } = req.body;
        if (isDefault) await Address.updateMany({ customer: req.user._id }, { isDefault: false });
        const address = await Address.create({ customer: req.user._id, label, street, city, country, isDefault });
        res.status(201).json({ success: true, data: { address } });
    } catch (err) { next(err); }
};

const updateAddress = async (req, res, next) => {
    try {
        const { label, street, city, country, isDefault } = req.body;
        if (isDefault) await Address.updateMany({ customer: req.user._id }, { isDefault: false });
        const address = await Address.findOneAndUpdate({ _id: req.params.id, customer: req.user._id }, { label, street, city, country, isDefault }, { new: true });
        if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
        res.json({ success: true, data: { address } });
    } catch (err) { next(err); }
};

const deleteAddress = async (req, res, next) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, customer: req.user._id });
        if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
        res.json({ success: true, message: 'Address deleted.' });
    } catch (err) { next(err); }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };