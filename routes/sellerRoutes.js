const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { getDashboard, getAnalytics, updateStock } = require('../controllers/sellerDashboardController');
const { getSellerOrders, getSellerOrder, updateOrderStatus } = require('../controllers/sellerOrderController');
const { changePassword } = require('../controllers/sellerAuthController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

// ── Multer for logo upload ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads/logos/')),
    filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// ── Profile update (with optional logo) ──
const Seller = require('../models/Seller');
const updateProfile = async (req, res, next) => {
    try {
        const { brandName, description, category, phone } = req.body;
        const updates = {};
        if (brandName) updates.brandName = brandName;
        if (description) updates.description = description;
        if (category) updates.category = category;
        if (phone) updates.phone = phone;
        if (req.file) updates.logo = `/uploads/logos/${req.file.filename}`;

        const seller = await Seller.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
            .select('-password -resetToken -resetTokenExpiry');

        res.json({ success: true, data: seller });
    } catch (err) {
        next(err);
    }
};

// ── Payment submission (seller confirms they sent payment) ──
router.post('/payment-submitted', protect, sellerOnly, async (req, res, next) => {
    try {
        const { plan, amount } = req.body;
        const validPlans = ['basic', 'standard', 'premium'];
        if (!validPlans.includes(plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });

        await Seller.findByIdAndUpdate(req.user._id, {
            subscriptionPlan: plan,
            subscriptionPaidAmount: amount,
            subscriptionStatus: 'pending',
            subscriptionPaidAt: new Date(),
        });

        res.json({ success: true, message: 'Payment submission recorded. Awaiting admin approval.' });
    } catch (err) {
        next(err);
    }
});

// ── Admin: approve seller subscription ──
router.patch('/admin/approve-subscription/:sellerId', protect, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admins only' });

        const seller = await Seller.findByIdAndUpdate(
            req.params.sellerId,
            {
                subscriptionStatus: 'active',
                isApproved: true,
                discountEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days discount
            },
            { new: true }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

        res.json({ success: true, message: 'Seller subscription activated.', data: seller });
    } catch (err) {
        next(err);
    }
});

router.use(protect, sellerOnly);

router.put('/profile', upload.single('logo'), updateProfile);
router.put('/change-password', changePassword);
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.patch('/products/:productId/stock', updateStock);
router.get('/orders', getSellerOrders);
router.get('/orders/:id', getSellerOrder);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;