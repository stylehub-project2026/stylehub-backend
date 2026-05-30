const Seller = require('../models/Seller');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Admin Login
exports.adminLogin = (req, res) => {
    const { email, password } = req.body;
    if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid admin credentials' });
};

// Get all sellers
exports.getSellers = async (req, res) => {
    const sellers = await Seller.find().select('-password');
    res.json(sellers);
};

// Approve seller
exports.approveSeller = async (req, res) => {
    const seller = await Seller.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
    );
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    res.json({ message: 'Seller approved', seller });
};

// Delete seller
exports.deleteSeller = async (req, res) => {
    await Seller.findByIdAndDelete(req.params.id);
    res.json({ message: 'Seller deleted' });
};

// Get all customers
exports.getCustomers = async (req, res) => {
    const customers = await Customer.find().select('-password');
    res.json(customers);
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
};

// Get commissions
exports.getCommissions = async (req, res) => {
    const orders = await Order.find({ status: { $ne: 'cancelled' } })
        .select('subtotal commissionAmount sellerEarnings commissionRate status createdAt')
        .sort({ createdAt: -1 });

    const totalCommission = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    const totalSales = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalSellerEarnings = orders.reduce((sum, o) => sum + (o.sellerEarnings || 0), 0);

    res.json({ orders, totalCommission, totalSales, totalSellerEarnings });
};