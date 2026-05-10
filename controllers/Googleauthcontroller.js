const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const { getAuth } = require('firebase-admin/auth');

// ─── Google OAuth ───────────────────────────────
const googleAuth = async (req, res, next) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'ID token is required.' });

        // Verify the Firebase token
        const decoded = await getAuth().verifyIdToken(idToken);
        const { email, name, picture } = decoded;

        // Split name into first/last
        const parts = (name || '').split(' ');
        const firstName = parts[0] || 'User';
        const lastName = parts.slice(1).join(' ') || '';

        // Find or create customer
        let customer = await Customer.findOne({ email });
        if (!customer) {
            customer = await Customer.create({
                firstName,
                lastName,
                email,
                password: Math.random().toString(36).slice(-12), // random password (won't be used)
                isGoogleAccount: true,
            });
        }

        // Issue JWT
        const token = jwt.sign(
            { id: customer._id, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    _id: customer._id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    role: 'customer',
                },
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { googleAuth };